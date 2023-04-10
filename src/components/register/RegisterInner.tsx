import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Oval } from 'react-loader-spinner';
import RoundedWindow from '../RoundedWindow';

import { InstructionsList } from './InstructionsList';
import { proofTypeToString } from './proofTypeSchema';
import { useProofSBT } from './useProofSBT';
import { useLocalCreds } from './useLocalCreds';
import { type SearchParamsProps } from './searchParamsSchema';

export const RegisterInner = ({
  params: { callback, credentialType, proofType }
}: {
  params: SearchParamsProps;
}) => {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const hostname = useMemo(() => new URL(callback).hostname, [callback]);

  const { hasCreds } = useLocalCreds(credentialType);
  const { address, hasProofMetadata } = useProofSBT(proofType);
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    // Check whether the user has creds of credentialType and whether they have a proof of proofType
    if (address) {
      // Clear relevant localStorage items.
      window.localStorage.removeItem('register-credentialType');
      window.localStorage.removeItem('register-proofType');
      window.localStorage.removeItem('register-callback');
      // Send user to the callback URL. Include address that owns the proof SBT
      window.location.href = `${callback}?address=${address}`;
      return;
    } else if (hasCreds) {
      // TODO: Add support for off-chain proofs (see off-chain-proofs component.)
      // Send user to proof generation page. User gets redirected back here after submitting their proof
      navigate(`/prove/${proofType}`);
    } else {
      // Send user to verification page for credentialType
      navigate(`/issuance/${credentialType}`);
    }

    window.localStorage.setItem('register-credentialType', credentialType);
    window.localStorage.setItem('register-proofType', proofType);
    window.localStorage.setItem('register-callback', callback);
  }, []);

  return (
    <>
      <RoundedWindow>
        <div
          style={{
            position: 'relative',
            paddingTop: '100px',
            width: '100%',
            height: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            flexDirection: 'column'
          }}
        >
          {error ? (
            <>
              <p style={{ color: 'red', fontSize: '1rem' }}>{error}</p>
            </>
          ) : loading ? (
            <Oval
              height={100}
              width={100}
              color="white"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
              ariaLabel="oval-loading"
              secondaryColor="black"
              strokeWidth={2}
              strokeWidthSecondary={2}
            />
          ) : (
            <>
              <p>
                <code>{hostname}</code> has requested a proof of{' '}
                {proofTypeToString[proofType]} from you. To fulfill this
                request, you need to
              </p>
              <div
                style={{
                  lineHeight: '1.5rem',
                  fontFamily: 'Montserrat',
                  fontSize: 'small'
                }}
              >
                <InstructionsList
                  proofType={proofType}
                  hasCreds={hasCreds}
                  hasProofMetadata={hasProofMetadata}
                />
              </div>
              <p>
                You will be guided through the process. Once you have generated
                the proof, you will be sent back to <code>{hostname}</code>.
              </p>
              <p>Click OK to continue.</p>
              <button
                type="button"
                className="x-button primary"
                onClick={handleClick}
              >
                OK
              </button>
            </>
          )}
        </div>
      </RoundedWindow>
    </>
  );
};
