import { z } from 'zod';
import { proofTypeSchema } from './proofTypeSchema';

export const credentialTypeSchema = z
  .string()
  .refine((value) => ['idgov', 'phone'].includes(value));

export const searchParamsSchema = z.object({
  credentialType: credentialTypeSchema,
  proofType: proofTypeSchema,
  callback: z.string().url()
});

export type SearchParamsProps = z.infer<typeof searchParamsSchema>;
