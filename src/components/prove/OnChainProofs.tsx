import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, type MouseEventHandler } from 'react';
import { Oval } from 'react-loader-spinner';
import { Success } from '../success';
import { truncateAddress } from '../../utils/ui-helpers';
import RoundedWindow from '../RoundedWindow';
import { proofs } from '../../constants';
import { useQuery } from '@tanstack/react-query';

const CustomOval = () => (
  <Oval
    height={10}
    width={10}
    color="#464646"
    wrapperStyle={{ marginLeft: '5px' }}
    wrapperClass=""
    visible={true}
    ariaLabel="oval-loading"
    secondaryColor="#01010c"
    strokeWidth={2}
    strokeWidthSecondary={2}
  />
);

const LoadingProofsButton = (props: {
  onClick: MouseEventHandler<HTMLButtonElement> | undefined;
}) => (
  <button className="x-button" onClick={props.onClick}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      Proof Loading
      <CustomOval />
    </div>
  </button>
);

const Proofs = () => {
  const params = useParams() as {
    proofType: keyof typeof proofs;
    callback: string;
  };
  const navigate = useNavigate();
  const proofSubmissionSuccess = true;
  // const error: { message: string } | null = null;
  const errorMessage = '';
  const alreadyHasSBT = false;
  const hasNecessaryCreds = false;
  const accountReadyAddress = '';
  const proof = null;
  const submissionConsentQuery = useQuery(['submission-consent'], {
    queryFn: async () => {
      return '';
    },
    enabled: false
  });
  const setSubmissionConsent = (value: boolean) => {};

  useEffect(() => {
    if (proofSubmissionSuccess) {
      if (params.callback) {
        window.location.href = `https://${params.callback}`;
      }
      const registerCredentialType = window.localStorage.getItem(
        'register-credentialType'
      );
      const registerProofType =
        window.localStorage.getItem('register-proofType');
      const registerCallback = window.localStorage.getItem('register-callback');
      if (registerCredentialType && registerProofType && registerCallback) {
        navigate(
          `/register?credentialType=${registerCredentialType}&proofType=${registerProofType}&callback=${registerCallback}`
        );
      }
    }
  }, [proofSubmissionSuccess]);

  if (proofSubmissionSuccess) {
    return <Success title="Success" />;
  }

  return (
    <RoundedWindow>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <h2>Prove {proofs[params.proofType].name}</h2>
        <div className="spacer-med" />
        <br />
        {errorMessage ? (
          <p>Error: {errorMessage}</p>
        ) : alreadyHasSBT ? (
          <p>You already have a soul-bound token (SBT) for this attribute.</p>
        ) : hasNecessaryCreds ? (
          <p>
            This will give you,
            <code> {truncateAddress(accountReadyAddress)} </code>, a{' '}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://cointelegraph.com/news/what-are-soulbound-tokens-sbts-and-how-do-they-work"
              style={{ color: '#fdc094' }}
            >
              soul-bound token
            </a>{' '}
            (SBT) showing only this one attribute of you:{' '}
            <code>{proofs[params.proofType].name}</code>. It may take 5-15
            seconds to load.
          </p>
        ) : (
          <p>
            &nbsp;Note: You cannot generate this proof without the necessary
            credentials. If you have not already, please{' '}
            {/* TODO: Get specific. Tell the user which credentials they need to get/verify. */}
            <a href="/issuance" style={{ color: '#fdc094' }}>
              verify yourself
            </a>
            .
          </p>
        )}
        <div className="spacer-med" />
        <br />
        {!alreadyHasSBT && hasNecessaryCreds ? (
          proof ? (
            <button
              className="x-button"
              onClick={() => {
                setSubmissionConsent(true);
              }}
            >
              {submissionConsentQuery.isFetching ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  Submitting
                  <CustomOval />
                </div>
              ) : (
                'Submit proof'
              )}
            </button>
          ) : (
            <LoadingProofsButton onClick={undefined} />
          )
        ) : (
          ''
        )}
      </div>
    </RoundedWindow>
  );
};

export default Proofs;
