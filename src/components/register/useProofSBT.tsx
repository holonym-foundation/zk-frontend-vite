import { useMemo } from 'react';
import { useProofMetadata } from '../../context/ProofMetadata';
import { type z } from 'zod';
import { type proofTypeSchema } from './proofTypeSchema';

// setError("Invalid callback URL. Callback is invalid.");
export const useProofSBT = (proofType: z.infer<typeof proofTypeSchema>) => {
  const { proofMetadata } = useProofMetadata();
  const proofMetadataForSBT = useMemo(
    () =>
      (proofType &&
        proofMetadata?.filter(
          (metadata) => metadata.proofType === proofType
        )) ??
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
