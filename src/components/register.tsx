/**
 * Users can be directed to this page from an external site when the owner
 * of the external site wants the user to verify a certain type of credential
 * and generate a certain proof.
 *
 * This component displays a loading screen while it parses the URL and
 * then redirects the user to the appropriate page (e.g., verify government ID).
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Oval } from 'react-loader-spinner';
import RoundedWindow from './RoundedWindow';
import { serverAddress } from '../constants';
import { useCreds } from '../context/Creds';
import { useProofMetadata } from '../context/ProofMetadata';
import { ProofType } from '../types';
import { z } from 'zod';

const proofTypeSchema = z.union([
  z.literal('uniqueness'),
  z.literal('us-residency'),
  z.literal('uniqueness-phone')
]);

const proofTypeToString: Record<z.infer<typeof proofTypeSchema>, string> = {
  uniqueness: 'uniqueness (government ID)',
  'us-residency': 'US residency',
  'uniqueness-phone': 'uniqueness (phone number)'
};

const credentialTypeSchema = z
  .string()
  .refine((value) => ['idgov', 'phone'].includes(value));

const searchParamsSchema = z.object({
  credentialType: credentialTypeSchema,
  proofType: proofTypeSchema,
  callback: z.string().url()
});

const InstructionsList = ({
  proofType,
  hasCreds,
  hasProofMetadata
}: {
  proofType: z.infer<typeof proofTypeSchema>;
  hasCreds: boolean;
  hasProofMetadata: boolean;
}) => {
  if (!hasCreds) {
    return (
      <ol>
        <li>
          {proofType === 'uniqueness-phone'
            ? 'Verify your phone number.'
            : 'Verify your government ID.'}
        </li>
        <li>Generate a proof of {proofTypeToString[proofType]}.</li>
      </ol>
    );
  }
  if (!hasProofMetadata) {
    return (
      <ol>
        <li>
          <s>
            {proofType === 'uniqueness-phone'
              ? 'Verify your phone number.'
              : 'Verify your government ID.'}
          </s>
          <span
            style={{ color: '#2fd87a', padding: '10px', fontSize: '1.3rem' }}
          >
            {'\u2713'}
          </span>
        </li>
        <li>Generate a proof of {proofTypeToString[proofType]}.</li>
      </ol>
    );
  }
  return (
    <ol>
      <li>
        <s>
          {proofType === 'uniqueness-phone'
            ? 'Verify your phone number.'
            : 'Verify your government ID.'}
        </s>
        <span style={{ color: '#2fd87a', padding: '10px', fontSize: '1.3rem' }}>
          {'\u2713'}
        </span>
      </li>
      <li>
        <s>Generate a proof of {proofTypeToString[proofType]}.</s>
        <span style={{ color: '#2fd87a', padding: '10px', fontSize: '1.3rem' }}>
          {'\u2713'}
        </span>
      </li>
    </ol>
  );
};

const RegisterScreen = () => {
  const [loadingError, setLoadingError] = useState<string>();
  const [searchParams] = useSearchParams();
  const params = useMemo(() => {
    try {
      return searchParamsSchema.parse({
        credentialType: searchParams.get('credentialType'),
        proofType: searchParams.get('proofType'),
        callback: searchParams.get('callback')
      });
    } catch (error) {
      setLoadingError(`${error}`);
      return null;
    }
  }, [searchParams]);

  if (params != null) {
    return <Register params={params} />;
  }
  return loadingError || null;
};

// setError("Invalid callback URL. Callback is invalid.");

const useSBT = (proofType: z.infer<typeof proofTypeSchema>) => {
  const { proofMetadata, loadingProofMetadata } = useProofMetadata();
  const proofMetadataForSBT = useMemo(
    () =>
      (proofType &&
        proofMetadata?.filter(
          (metadata) => metadata.proofType === proofType
        )) ||
      null,
    [proofMetadata, proofType]
  );

  const hasProofMetadata = useMemo(
    () => proofMetadataForSBT && proofMetadataForSBT.length > 0,
    [proofMetadataForSBT]
  );
  const address = useMemo(
    () =>
      proofMetadataForSBT && proofMetadataForSBT.length > 0
        ? proofMetadataForSBT[0].address
        : null,
    [proofMetadataForSBT]
  );

  return { address, hasProofMetadata };
};

const useLocalCreds = (
  credentialType: z.infer<typeof credentialTypeSchema>
) => {
  const { sortedCreds, loadingCreds } = useCreds();
  const creds = useMemo(() => {
    const server = credentialType === 'idgov' ? 'idgov-v2' : 'phone-v2';
    return sortedCreds?.[serverAddress[server]];
  }, [credentialType, sortedCreds]);

  const hasCreds = useMemo(() => !!creds, [creds]);
  return {
    hasCreds,
    creds
  };
};

const Register = ({
  params: { callback, credentialType, proofType }
}: {
  params: z.infer<typeof searchParamsSchema>;
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  const hostname = useMemo(() => new URL(callback).hostname, [callback]);

  const { hasCreds, creds } = useLocalCreds(credentialType);
  const { address, hasProofMetadata } = useSBT(proofType);

  const handleClick = useCallback(() => {
    // Check whether the user has creds of credentialType and whether they have a proof of proofType
    if (address) {
      // Clear relevant localStorage items.
      window.localStorage.removeItem('register-credentialType');
      window.localStorage.removeItem('register-proofType');
      window.localStorage.removeItem('register-callback');
      // Send user to the callback URL. Include address that owns the proof SBT
      window.location.href = `${callback}?address=${address}`;
      return;
    } else if (hasCreds) {
      // TODO: Add support for off-chain proofs (see off-chain-proofs component.)
      // Send user to proof generation page. User gets redirected back here after submitting their proof
      navigate(`/prove/${proofType}`);
    } else {
      // Send user to verification page for credentialType
      navigate(`/issuance/${credentialType}`);
    }

    window.localStorage.setItem('register-credentialType', credentialType);
    window.localStorage.setItem('register-proofType', proofType);
    window.localStorage.setItem('register-callback', callback);
  }, []);

  return (
    <>
      <RoundedWindow>
        <div
          style={{
            position: 'relative',
            paddingTop: '100px',
            width: '100%',
            height: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            flexDirection: 'column'
          }}
        >
          {error ? (
            <>
              <p style={{ color: 'red', fontSize: '1rem' }}>{error}</p>
            </>
          ) : loading ? (
            <Oval
              height={100}
              width={100}
              color="white"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
              ariaLabel="oval-loading"
              secondaryColor="black"
              strokeWidth={2}
              strokeWidthSecondary={2}
            />
          ) : (
            <>
              <p>
                <code>{hostname}</code> has requested a proof of{' '}
                {proofTypeToString[proofType]} from you. To fulfill this
                request, you need to
              </p>
              <div
                style={{
                  lineHeight: '1.5rem',
                  fontFamily: 'Montserrat',
                  fontSize: 'small'
                }}
              >
                <InstructionsList
                  proofType={proofType}
                  hasCreds={hasCreds}
                  hasProofMetadata={hasProofMetadata}
                />
              </div>
              <p>
                You will be guided through the process. Once you have generated
                the proof, you will be sent back to <code>{hostname}</code>.
              </p>
              <p>Click OK to continue.</p>
              <button
                type="button"
                className="x-button primary"
                onClick={handleClick}
              >
                OK
              </button>
            </>
          )}
        </div>
      </RoundedWindow>
    </>
  );
};

export default RegisterScreen;
