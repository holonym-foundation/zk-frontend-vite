import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useLocalStorageToNavigate = (success: boolean) => {
  const navigate = useNavigate();
  useEffect(() => {
    const registerCredentialType = window.localStorage.getItem(
      'register-credentialType'
    );
    const registerProofType = window.localStorage.getItem('register-proofType');
    const registerCallback = window.localStorage.getItem('register-callback');
    if (
      success &&
      registerCredentialType != null &&
      registerProofType != null &&
      registerCallback != null
    ) {
      navigate(
        `/register?credentialType=${registerCredentialType}&proofType=${registerProofType}&callback=${registerCallback}`
      );
    }
  }, [success]);
};
