import { useMemo } from 'react';
import { serverAddress } from '../../constants';
import { useCreds } from '../../context/Creds';
import { type z } from 'zod';
import { type credentialTypeSchema } from './searchParamsSchema';

export const useLocalCreds = (
  credentialType: z.infer<typeof credentialTypeSchema>
) => {
  const { sortedCreds } = useCreds();
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
