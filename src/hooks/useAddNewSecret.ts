import { useMutation } from 'react-query';
import { createLeaf } from '../utils/zokrates';
import { generateSecret } from '../utils/secrets';

export function useAddNewSecret({
  retrievalEndpoint,
  newCreds
}: {
  retrievalEndpoint: string;
  newCreds: {
    newLeaf?: string;
    creds: {
      newSecret?: string;
      serializedAsPreimage: string[];
      serializedAsNewPreimage?: string[];
    };
  };
}) {
  const {
    data: newCredsWithNewSecret,
    isLoading,
    error,
    mutate
  } = useMutation(async () => {
    const newSecret =
      sessionStorage.getItem(`holoNewSecret-${retrievalEndpoint}`) ||
      generateSecret();
    sessionStorage.setItem(`holoNewSecret-${retrievalEndpoint}`, newSecret);

    const credsTemp = { ...newCreds };
    credsTemp.creds.newSecret = newSecret;
    credsTemp.creds.serializedAsNewPreimage = [
      ...credsTemp.creds.serializedAsPreimage
    ];
    credsTemp.creds.serializedAsNewPreimage[1] = credsTemp.creds.newSecret;
    credsTemp.newLeaf = await createLeaf(
      credsTemp.creds.serializedAsNewPreimage
    );

    return credsTemp;
  });

  return {
    newCredsWithNewSecret,
    isLoading,
    error,
    addNewSecret: mutate
  };
}
