import { useState, useEffect } from 'react';
import { isEqual } from 'lodash';
import { Credentials } from '../types'; // replace this with the actual path to your credentials types

interface Props {
  setError: (error: string) => void;
  sortedCreds: Record<string, Credentials> | undefined;
  loadingCreds: boolean;
  newCreds: Credentials | undefined;
}

interface State {
  confirmationStatus: 'init' | 'confirmed' | 'denied' | 'confirmationRequired';
  credsThatWillBeOverwritten: Credentials | undefined;
  mergedSortedCreds: Record<string, Credentials> | undefined;
}

export function useMergeCreds({ setError, sortedCreds, loadingCreds, newCreds }: Props): State {
  const [confirmationStatus, setConfirmationStatus] = useState<State['confirmationStatus']>('init');
  const [credsThatWillBeOverwritten, setCredsThatWillBeOverwritten] = useState<State['credsThatWillBeOverwritten']>();
  const [mergedSortedCreds, setMergedSortedCreds] = useState<State['mergedSortedCreds']>();

  const onConfirmOverwrite = () => {
    setConfirmationStatus('confirmed');
  };

  const onDenyOverwrite = () => {
    setConfirmationStatus('denied');
  };

  useEffect(() => {
    if (confirmationStatus !== 'init') {
      return;
    }

    if (!(loadingCreds || sortedCreds) || loadingCreds) {
      return;
    }

    if (!newCreds?.creds?.issuerAddress) {
      return;
    }

    if (!setError) {
      return;
    }

    const lowerCaseIssuerWhitelist = issuerWhitelist.map((issuer) => issuer.toLowerCase());

    if (!lowerCaseIssuerWhitelist.includes(newCreds.creds.issuerAddress.toLowerCase())) {
      setError(`Issuer ${newCreds.creds.issuerAddress} is not whitelisted.`);
      return;
    }

    if (sortedCreds?.[newCreds.creds.issuerAddress]) {
      if (isEqual(sortedCreds[newCreds.creds.issuerAddress], newCreds)) {
        setConfirmationStatus('confirmed');
        return;
      }

      setConfirmationStatus('confirmationRequired');
      setCredsThatWillBeOverwritten(sortedCreds[newCreds.creds.issuerAddress]);
    } else {
      setConfirmationStatus('confirmed');
    }
  }, [sortedCreds, loadingCreds, newCreds, confirmationStatus, setError]);

  useEffect(() => {
    if (!(sortedCreds && newCreds?.creds?.issuerAddress) || confirmationStatus !== 'confirmed') {
      return;
    }

    const mergedSortedCredsTemp = {
      ...sortedCreds,
      [newCreds.creds.issuerAddress]: newCreds,
    };

    if (isEqual(mergedSortedCreds, mergedSortedCredsTemp)) {
      return;
    }

    setMergedSortedCreds(mergedSortedCredsTemp);
  }, [sortedCreds, newCreds, confirmationStatus, mergedSortedCreds]);

  return {
    confirmationStatus,
    credsThatWillBeOverwritten,
    mergedSortedCreds,
    onConfirmOverwrite,
    onDenyOverwrite,
  };
}
