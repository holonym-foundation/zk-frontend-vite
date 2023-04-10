/**
 * Component for finalizing the verification flow for credentials from external issuers.
 */
import { useState, useEffect } from 'react';
import FinalStep from './FinalStep';
import StepSuccess from './StepSuccess';
import IssuanceContainer from './IssuanceContainer';
import { steps } from '../../constants';

const ExternalIssuance = () => {
  const [success, setSuccess] = useState<boolean>();
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentStep = 'Finalize';

  useEffect(() => {
    setCurrentIdx(steps.indexOf(currentStep));
  }, [currentStep]);

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
