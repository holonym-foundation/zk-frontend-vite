import { type z } from 'zod';
import { proofTypeToString, type proofTypeSchema } from './proofTypeSchema';

export const InstructionsList = ({
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
