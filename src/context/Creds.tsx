/**
 * Context provider for creds.
 */
import {
  createContext,
  useContext,
  type PropsWithChildren,
  useMemo
} from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { getCredentials, storeCredentials } from '../utils/secrets';
import { useHoloAuthSig } from './HoloAuthSig';
import { useHoloKeyGenSig } from './HoloKeyGenSig';
import { serverAddress } from '../constants';
import { useQuery } from '@tanstack/react-query';
import {
  type ProofType,
  type GovIdCreds,
  type MedicalCreds,
  type PhoneNumCreds,
  type Proof,
  type SortedCreds
} from '../types';

const CredsContext = createContext<{
  sortedCreds?: SortedCreds;
  govIdCreds?: GovIdCreds;
  phoneNumCreds?: PhoneNumCreds;
  medicalCreds?: MedicalCreds;
  loadingCreds: boolean;
  getHasNecessaryCreds: (proofType: ProofType) => boolean;
  reloadCreds: () => Promise<void>;
  storeCreds: (sortedCreds: SortedCreds, kolpProof: Proof) => Promise<$TSFixMe>;
} | null>(null);

function CredsProvider({ children }: PropsWithChildren) {
  // TODO: Maybe use a mutex here to prevent multiple places from updating creds at the same time.
  // This is incredibly important at the end of the verification flow when the creds are being updated, and
  // the store-credentials and glowy-green-button components need to have the highest write privileges.
  // OR: Maybe use a hot/cold storage system where the cold storage (i.e., localStorage and remote backup)
  // is only updated infrequently and when we are absolutely sure we want to make the update.
  // OR: Maybe use a mutex and a hot/cold storage system together. Use the mutex for cold storage.
  const [sortedCreds, setSortedCreds] = useSessionStorage<SortedCreds>(
    'sorted-creds',
    {}
  );
  const { holoAuthSigDigest } = useHoloAuthSig();
  const { holoKeyGenSigDigest } = useHoloKeyGenSig();
  const govIdCreds = useMemo(
    () =>
      (sortedCreds != null &&
        serverAddress['idgov-v2'] in sortedCreds &&
        sortedCreds[serverAddress['idgov-v2']]) ||
      undefined,
    [sortedCreds]
  );
  const phoneNumCreds = useMemo(
    () =>
      (sortedCreds != null &&
        serverAddress['phone-v2'] in sortedCreds &&
        sortedCreds[serverAddress['phone-v2']]) ||
      undefined,
    [sortedCreds]
  );
  const medicalCreds = useMemo(
    () =>
      (sortedCreds != null &&
        serverAddress.med in sortedCreds &&
        sortedCreds[serverAddress.med]) ||
      undefined,
    [sortedCreds]
  );

  const loadCredsQuery = useQuery(['load-creds'], {
    queryFn: async () => {
      if (!holoKeyGenSigDigest || !holoAuthSigDigest) return;
      return await getCredentials(
        holoKeyGenSigDigest,
        holoAuthSigDigest,
        false
      );
    },
    onSuccess(data) {
      setSortedCreds(data as SortedCreds);
    },
    enabled: !!holoKeyGenSigDigest && !!holoAuthSigDigest
  });

  async function storeCreds(sortedCreds: SortedCreds, kolpProof: Proof) {
    const result = await storeCredentials(
      sortedCreds,
      holoKeyGenSigDigest,
      holoAuthSigDigest,
      kolpProof
    );
    if (result) {
      await loadCredsQuery.refetch();
    }
    return result;
  }

  return (
    <CredsContext.Provider
      value={{
        phoneNumCreds,
        medicalCreds,
        govIdCreds,
        sortedCreds,
        loadingCreds: loadCredsQuery.isLoading,
        reloadCreds: async () => {
          await loadCredsQuery.refetch();
        },
        storeCreds,
        getHasNecessaryCreds(proofType: ProofType) {
          const { govIdCreds, phoneNumCreds, medicalCreds } = useCreds();
          switch (proofType) {
            case 'us-residency':
            case 'uniqueness':
              return Boolean(govIdCreds?.creds);
            case 'uniqueness-phone':
              return Boolean(phoneNumCreds?.creds);
            case 'medical-specialty':
              return Boolean(medicalCreds?.creds);
            default:
              return false;
          }
        }
      }}
    >
      {children}
    </CredsContext.Provider>
  );
}

// Helper hook to access the provider values
const useCreds = () => {
  const value = useContext(CredsContext);
  if (value === null) {
    throw new Error(
      'useCreds called withing a component that is not withing the CredsProvider'
    );
  }
  return value;
};

export { CredsProvider, useCreds };
