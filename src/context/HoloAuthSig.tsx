/**
 * Simple provider component & hook to store the Holo auth sig (and sigDigest) in
 * context so that it doesn't have to be passed as props to every component
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useSignMessage } from 'wagmi';
import { useLocalStorage } from 'usehooks-ts';
import { sha256 } from '../utils/secrets';
import { holonymAuthMessage } from '../constants';

interface HoloAuthSigContextValue {
  signHoloAuthMessage: () => Promise<void>;
  holoAuthSigIsError: boolean;
  holoAuthSigIsLoading: boolean;
  holoAuthSigIsSuccess: boolean;
  holoAuthSig: string;
  holoAuthSigDigest: string;
  clearHoloAuthSig: () => void;
}

const HoloAuthSigContext = createContext<HoloAuthSigContextValue | null>(null);

function HoloAuthSigProvider({ children }: $TSFixMe) {
  const [holoAuthSig, setHoloAuthSig] = useLocalStorage('holoAuthSig', '');
  const [holoAuthSigDigest, setHoloAuthSigDigest] = useLocalStorage(
    'holoAuthSigDigest',
    ''
  );
  // Using useLocalStorage on strings results in double quotes being added to the ends of the strings
  const parsedHoloAuthSig = useMemo(
    () => holoAuthSig?.replaceAll('"', ''),
    [holoAuthSig]
  );
  const parsedHoloAuthSigDigest = useMemo(
    () => holoAuthSigDigest?.replaceAll('"', ''),
    [holoAuthSigDigest]
  );
  const {
    isError: holoAuthSigIsError,
    isLoading: holoAuthSigIsLoading,
    isSuccess: holoAuthSigIsSuccess,
    signMessageAsync
  } = useSignMessage({ message: holonymAuthMessage });

  async function signHoloAuthMessage() {
    console.log('requesting holoAuthSig');
    const signedMessage = await signMessageAsync();
    setHoloAuthSig(signedMessage);
    const digest = await sha256(signedMessage);
    setHoloAuthSigDigest(digest);
  }

  function clearHoloAuthSig() {
    setHoloAuthSig('');
    setHoloAuthSigDigest('');
  }

  return (
    <HoloAuthSigContext.Provider
      value={{
        signHoloAuthMessage,
        holoAuthSigIsError,
        holoAuthSigIsLoading,
        holoAuthSigIsSuccess,
        holoAuthSig: parsedHoloAuthSig,
        holoAuthSigDigest: parsedHoloAuthSigDigest,
        clearHoloAuthSig
      }}
    >
      {children}
    </HoloAuthSigContext.Provider>
  );
}

// Helper hook to access the provider values
const useHoloAuthSig = () => {
  const value = useContext(HoloAuthSigContext);
  if (value === null) {
    throw new Error(
      'useHoloAuthSig called withing a component that is not withing the HoloAuthSigProvider'
    );
  }
  return value;
};

export { HoloAuthSigProvider, useHoloAuthSig };
