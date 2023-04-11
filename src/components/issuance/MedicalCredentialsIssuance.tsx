import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import FinalStep from './FinalStep';
import StepSuccess from './StepSuccess';
import { steps, medDAOIssuerOrigin } from '../../constants';
import IssuanceContainer from './IssuanceContainer';
import { useCreds } from '../../context/Creds';
import { useQuery } from '@tanstack/react-query';
import { proofsWorker } from '../../context/Proofs';
import { proveGovIdFirstNameLastName } from '../../utils/proofs';
import { useLocalStorageToNavigate } from './useLocalStorageToNavigate';

const runInMainThread = false;
const forceReload = false;

// TODO: Do we need phone # for this?
const VerificationRequestForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const { govIdCreds } = useCreds();
  const govIdFirstNameLastNameProofQuery = useQuery(
    ['govIdFirstNameLastNameProof'],
    async () => {
      if (govIdCreds == null) return undefined;
      if (!runInMainThread && proofsWorker !== null) {
        proofsWorker.postMessage({
          message: 'gov-id-firstname-lastname',
          govIdCreds,
          forceReload
        });
      } else {
        try {
          return await proveGovIdFirstNameLastName(govIdCreds);
        } catch (err) {
          console.error(err);
        }
      }
    },
    { enabled: !(govIdCreds == null) }
  );

  async function onSubmit(
    values: { firstName: string; lastName: string; npiNumber: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) {
    try {
      const resp = await fetch(`${medDAOIssuerOrigin}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          npiNumber: values.npiNumber,
          proof: govIdFirstNameLastNameProofQuery.data
        })
      });
      const data = (await resp.json()) as {
        id?: string;
        error?: string;
        message?: string;
      };
      console.log('server response...');
      console.log(data);
      if (resp.status === 200 && data.id) {
        const retrievalEndpoint = `${medDAOIssuerOrigin}/verification/credentials?id=${data.id}`;
        const encodedRetrievalEndpoint = encodeURIComponent(
          window.btoa(retrievalEndpoint)
        );
        navigate(
          `/issuance/med/store?retrievalEndpoint=${encodedRetrievalEndpoint}`
        );
      } else if (data.error && data.message) {
        if (data.message.includes('Unsupported specialty')) {
          setError(
            'This specialty is not supported yet but is in development.'
          );
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (error != null) {
    return (
      <>
        <div>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </>
    );
  }
  if (govIdCreds == null) {
    return (
      <>
        <div>
          <p style={{ color: 'red' }}>
            Error: No government ID credentials found.
          </p>
          <p>
            You can add government ID credentials to your Holo{' '}
            <button
              style={{ backgroundColor: 'transparent', padding: '0px' }}
              className="in-text-link"
              onClick={() => {
                navigate('/issuance/idgov');
              }}
            >
              here
            </button>
            .
          </p>
        </div>
      </>
    );
  }
  return (
    <>
      <h3 style={{ marginTop: '-25px' }}>Request Verification</h3>
      <div
        style={{
          fontFamily: 'Montserrat',
          fontWeight: '100',
          fontSize: '14px',
          marginBottom: '30px'
        }}
      >
        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            npiNumber: ''
          }}
          validationSchema={toFormikValidationSchema(
            z.object({
              firstName: z.string().default(''),
              lastName: z.string().default(''),
              npiNumber: z
                .string()
                .min(10, 'NPI number must be 10 digits')
                .default('')
            })
          )}
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div style={{ margin: '20px' }}>
                <label htmlFor="first-name">First name</label>
                <Field
                  type="text"
                  name="firstName"
                  className="text-field short-y long-x"
                />
                <ErrorMessage
                  name="firstName"
                  component={'div'}
                  className="text-red"
                />
              </div>
              <div style={{ margin: '20px' }}>
                <label htmlFor="last-name">Last name</label>
                <Field
                  type="text"
                  name="lastName"
                  className="text-field short-y long-x"
                />
                <ErrorMessage
                  name="lastName"
                  component={'div'}
                  className="text-red"
                />
              </div>
              <div style={{ margin: '20px' }}>
                <label htmlFor="npi-number">NPI number</label>
                <Field
                  type="text"
                  name="npiNumber"
                  className="text-field short-y long-x"
                />
                <ErrorMessage
                  name="npiNumber"
                  component={'div'}
                  className="text-red"
                />
              </div>
              <button
                className="x-button secondary outline"
                style={{ width: '100%', marginLeft: 'auto' }}
                type="submit"
                disabled={
                  isSubmitting ?? !govIdFirstNameLastNameProofQuery.data
                }
              >
                {isSubmitting
                  ? 'Submitting...'
                  : !govIdFirstNameLastNameProofQuery.data
                    ? 'Loading proof...'
                    : 'Submit'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

function useMedicalCredentialsIssuance() {
  const { store } = useParams();
  const [success, setSuccess] = useState<boolean>();
  const currentStep = useMemo(() => {
    if (store == null) return 'Verify';
    if (store.length > 0) return 'Finalize';
  }, [store]);

  const currentIdx = useMemo(() => {
    if (currentStep == null) return 0;
    return steps.indexOf(currentStep);
  }, [currentStep]);

  return {
    success,
    setSuccess,
    currentIdx,
    steps,
    currentStep
  };
}

const MedicalCredentialsIssuance = () => {
  const { success, setSuccess, currentIdx, steps, currentStep } =
    useMedicalCredentialsIssuance();
  useLocalStorageToNavigate(!!success);

  return (
    <IssuanceContainer steps={steps} currentIdx={currentIdx}>
      {success ? (
        <StepSuccess />
      ) : currentStep === 'Verify' ? (
        <VerificationRequestForm /> // currentStep === "Finalize" ? (
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

export default MedicalCredentialsIssuance;
