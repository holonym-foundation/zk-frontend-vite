import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { useHoloAuthSig } from '../context/HoloAuthSig';
import { useHoloKeyGenSig } from '../context/HoloKeyGenSig';
import { holonymAuthMessage, holonymKeyGenMessage } from '../constants';

export default function useSignatureGate(gate: $TSFixMe) {
  const { data: account } = useAccount();
  const {
    signHoloAuthMessage,
    holoAuthSigIsError,
    holoAuthSigIsLoading,
    holoAuthSigIsSuccess,
    holoAuthSig,
    holoAuthSigDigest,
    clearHoloAuthSig
  } = useHoloAuthSig();
  const {
    signHoloKeyGenMessage,
    holoKeyGenSigIsError,
    holoKeyGenSigIsLoading,
    holoKeyGenSigIsSuccess,
    holoKeyGenSig,
    holoKeyGenSigDigest,
    clearHoloKeyGenSig
  } = useHoloKeyGenSig();

  useEffect(() => {
    if (!(account?.address && account?.connector != null)) return;
    if (!(holoAuthSig || holoAuthSigIsLoading || holoAuthSigIsSuccess)) {
      signHoloAuthMessage().catch((err) => {
        console.error(err);
      });
    }
    if (
      !(
        holoAuthSigIsLoading ||
        holoKeyGenSig ||
        holoKeyGenSigIsLoading ||
        holoKeyGenSigIsSuccess
      )
    ) {
      signHoloKeyGenMessage().catch((err) => {
        console.error(err);
      });
    }
  }, [
    account,
    holoAuthSigIsError,
    holoAuthSigIsLoading,
    holoAuthSigIsSuccess,
    holoKeyGenSigIsError,
    holoKeyGenSigIsLoading,
    holoKeyGenSigIsSuccess
  ]);

  useEffect(() => {
    if (!(account?.address && account?.connector != null)) return;
    // Check that sigs are from account. If they aren't, re-request them
    if (
      holoAuthSig &&
      ethers.utils.verifyMessage(holonymAuthMessage, holoAuthSig) !==
        account.address
    ) {
      console.log('account changed. Re-retrieving holoAuthSig');
      clearHoloAuthSig();
      signHoloAuthMessage().catch((err) => {
        console.error(err);
      });
    }
    if (
      holoKeyGenSig &&
      ethers.utils.verifyMessage(holonymKeyGenMessage, holoKeyGenSig) !==
        account.address
    ) {
      console.log('account changed. Re-retrieving holoKeyGenSig');
      clearHoloKeyGenSig();
      signHoloKeyGenMessage().catch((err) => {
        console.error(err);
      });
    }
  }, [account]);

  return gate({
    holoAuthSig,
    holoAuthSigDigest,
    holoKeyGenSig,
    holoKeyGenSigDigest
  });
}
