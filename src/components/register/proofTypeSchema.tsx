import { z } from 'zod';

export const proofTypeSchema = z.union([
  z.literal('uniqueness'),
  z.literal('us-residency'),
  z.literal('uniqueness-phone')
]);

export const proofTypeToString: Record<
  z.infer<typeof proofTypeSchema>,
  string
> = {
  uniqueness: 'uniqueness (government ID)',
  'us-residency': 'US residency',
  'uniqueness-phone': 'uniqueness (phone number)'
};
