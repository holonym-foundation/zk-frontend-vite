/**
 * Component for finalizing the verification flow for credentials from external issuers.
 */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FinalStep from "./FinalStep";
import StepSuccess from "./StepSuccess";
import IssuanceContainer from "./IssuanceContainer";

function useExternalIssuanceState() {
  const { store } = useParams();
  const [success, setSuccess] = useState();
  const [currentIdx, setCurrentIdx] = useState(0);

  const steps = ["Verify", "Finalize"];

  const currentStep = "Finalize";

  useEffect(() => {
    setCurrentIdx(steps.indexOf(currentStep));
  }, [currentStep])

  return {
    success,
    setSuccess,
    currentIdx,
    setCurrentIdx,
    steps,
    currentStep,
  };
}

const ExternalIssuance = () => {
  const {
    success,
    setSuccess,
    currentIdx,
    setCurrentIdx,
    steps,
    currentStep,
  } = useExternalIssuanceState();

  return (
    <IssuanceContainer steps={steps} currentIdx={currentIdx}>
      {success ? (
        <StepSuccess />
      ) : (
        // @ts-expect-error TS(2345): Argument of type 'true' is not assignable to param... Remove this comment to see the full error message
        <FinalStep onSuccess={() => setSuccess(true)} />
      )}
    </IssuanceContainer>
  );
};

export default ExternalIssuance;
