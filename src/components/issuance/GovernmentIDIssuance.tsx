import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createVeriffFrame, MESSAGES } from '@veriff/incontext-sdk';
import { useQuery } from '@tanstack/react-query';
import FinalStep from './FinalStep';
import StepSuccess from './StepSuccess';
import VerificationContainer from './IssuanceContainer';
import {
  getRetrivalEndpointForVeriffSessionId,
  getVeriffSession
} from '../../id-server';
import { steps } from '../../constants';

const GovernmentIDIssuance = () => {
  const navigate = useNavigate();
  const { store } = useParams();
  const [success, setSuccess] = useState<boolean>();
  const veriffSessionId = useMemo(
    () => localStorage.getItem('veriff-sessionId'),
    []
  );
  const [retry, setRetry] = useState<boolean>(!!veriffSessionId);
  const retrievalEndpoint =
    getRetrivalEndpointForVeriffSessionId(veriffSessionId);
  const currentStep = useMemo(() => (!store ? 'Verify' : 'Finalize'), [store]);
  const currentIdx = useMemo(() => steps.indexOf(currentStep), [currentStep]);

  const veriffSessionQuery = useQuery({
    queryKey: ['veriffSession'],
    queryFn: getVeriffSession,
    enabled: currentStep === 'Verify'
  });

  useEffect(() => {
    if (currentStep === 'Verify' && !veriffSessionQuery.data?.url) return;
    const verification = veriffSessionQuery.data;
    const handleVeriffEvent = (msg: MESSAGES) => {
      if (msg === MESSAGES.FINISHED && verification.id) {
        const encodedRetrievalEndpoint = encodeURIComponent(
          window.btoa(getRetrivalEndpointForVeriffSessionId(verification.id))
        );
        navigate(
          `/issuance/idgov/store?retrievalEndpoint=${encodedRetrievalEndpoint}`
        );
      }
    };
    createVeriffFrame({
      url: verification.url,
      onEvent: handleVeriffEvent
    });
  }, [veriffSessionQuery]);

  useEffect(() => {
    if (success && window.localStorage.getItem('register-credentialType')) {
      navigate(
        `/register?credentialType=${window.localStorage.getItem(
          'register-credentialType'
        )}&proofType=${window.localStorage.getItem(
          'register-proofType'
        )}&callback=${window.localStorage.getItem('register-callback')}`
      );
    }
  }, [success]);

  const handleSkipStore = useCallback(() => {
    if (veriffSessionId) {
      window.location.href = `/issuance/idgov/store?retrievalEndpoint=${encodeURIComponent(
        window.btoa(getRetrivalEndpointForVeriffSessionId(veriffSessionId))
      )}`;
    }
  }, []);

  return (
    <VerificationContainer steps={steps} currentIdx={currentIdx}>
      {success ? (
        <StepSuccess />
      ) : retry && currentStep !== 'Finalize' ? (
        <div style={{ textAlign: 'center' }}>
          <h2>Skip verification?</h2>
          <p>We noticed you have verified yourself already.</p>
          <p>Would you like to skip to the Store step?</p>
          <div style={{ display: 'flex', flex: 'flex-row', marginTop: '20px' }}>
            <button
              className="export-private-info-button"
              style={{
                lineHeight: '1',
                fontSize: '16px'
              }}
              onClick={() => {
                setRetry(false);
              }}
            >
              No, I want to verify again
            </button>
            <div style={{ margin: '10px' }} />
            <button
              className="x-button"
              style={{
                lineHeight: '1',
                fontSize: '16px'
              }}
              onClick={() => {
                handleSkipStore();
              }}
            >
              Yes
            </button>
          </div>
        </div>
      ) : currentStep === 'Verify' ? (
        <>
          <h3 style={{ marginBottom: '25px', marginTop: '-25px' }}>
            Verify your ID
          </h3>
        </>
      ) : (
        <FinalStep
          onSuccess={() => {
            setSuccess(true);
          }}
        />
      )}
    </VerificationContainer>
  );
};

export default GovernmentIDIssuance;
