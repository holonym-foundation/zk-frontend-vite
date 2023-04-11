import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import PhoneNumberForm from '../atoms/PhoneNumberForm';
import { zkPhoneEndpoint } from '../../constants';
import FinalStep from './FinalStep';
import StepSuccess from './StepSuccess';
import IssuanceContainer from './IssuanceContainer';
import { useLocalStorageToNavigate } from './useLocalStorageToNavigate';
import { useQuery } from '@tanstack/react-query';

function useVerifyPhoneNumberState() {
  const navigate = useNavigate();
  const { store } = useParams();
  const [success, setSuccess] = useState<boolean>();
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [code, setCode] = useState('');

  const steps = ['Phone#', 'Verify', 'Finalize'];

  const currentStep = useMemo(() => {
    if (!store && !phoneNumber) {
      return 'Phone#';
    }
    if (!store && phoneNumber) {
      return 'Verify';
    }
    return 'Finalize';
  }, [store, phoneNumber]);

  const currentIdx = useMemo(() => steps.indexOf(currentStep), [currentStep]);

  useLocalStorageToNavigate(!!success);

  useQuery(['send-code'], {
    queryFn: async () =>
      phoneNumber &&
      (await axios.get(`${zkPhoneEndpoint}/send/${phoneNumber}`)),
    enabled: !!phoneNumber
  });

  useEffect(() => {
    if (code.length === 6 && phoneNumber !== undefined) {
      const country = parsePhoneNumber(phoneNumber)?.country;
      if (!country) {
        throw new Error('Country is undefined');
      }
      const retrievalEndpoint = `${zkPhoneEndpoint}/getCredentials/v2/${phoneNumber}/${code}/${country}`;
      const encodedRetrievalEndpoint = encodeURIComponent(
        window.btoa(retrievalEndpoint)
      );
      navigate(
        `/issuance/phone/store?retrievalEndpoint=${encodedRetrievalEndpoint}`
      );
    }
  }, [code]);

  return {
    success,
    setSuccess,
    currentIdx,
    steps,
    currentStep,
    phoneNumber,
    setPhoneNumber,
    code,
    setCode
  };
}

const VerifyPhoneNumber = () => {
  const {
    success,
    setSuccess,
    currentIdx,
    steps,
    currentStep,
    setPhoneNumber,
    code,
    setCode
  } = useVerifyPhoneNumberState();

  return (
    <IssuanceContainer steps={steps} currentIdx={currentIdx}>
      {success ? (
        <StepSuccess />
      ) : currentStep === 'Phone#' ? (
        <PhoneNumberForm onSubmit={setPhoneNumber} />
      ) : currentStep === 'Verify' ? (
        <>
          <h2 style={{ marginBottom: '25px' }}>Enter the code texted to you</h2>
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
            }}
            className="text-field"
          />
        </> // currentStep === "Finalize" ? (
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

export default VerifyPhoneNumber;
