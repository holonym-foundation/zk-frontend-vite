/**
 * Component for finalizing the verification flow for credentials from external issuers.
 */
import { useState, useMemo } from 'react';
import FinalStep from './FinalStep';
import StepSuccess from './StepSuccess';
import IssuanceContainer from './IssuanceContainer';
import { steps } from '../../constants';

const ExternalIssuance = () => {
  const [success, setSuccess] = useState<boolean>();
  const currentStep = 'Finalize';

  const currentIdx = useMemo(() => steps.indexOf(currentStep), [currentStep]);

  return (
    <IssuanceContainer steps={steps} currentIdx={currentIdx}>
      {success ? (
        <StepSuccess />
      ) : (
        <FinalStep
          onSuccess={() => {
            setSuccess(true);
          }}
        />
      )}
    </IssuanceContainer>
  );
};

export default ExternalIssuance;
