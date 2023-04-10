import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { clientPortalUrl, proofs } from '../../constants';
// import residencyStoreABI from "../constants/abi/zk-contracts/ResidencyStore.json";
// import antiSybilStoreABI from "../constants/abi/zk-contracts/AntiSybilStore.json";
import { Oval } from 'react-loader-spinner';
import RoundedWindow from '../RoundedWindow';
import { useQuery } from '@tanstack/react-query';
import { useCreds } from '../../context/Creds';

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

const LoadingProofsButton = (props: { onClick: () => void }) => (
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

const useHook = () => {
  const [searchParams] = useSearchParams();
  const params = useParams() as {
    proofType: keyof typeof proofs;
    callback: string;
  };
  const { getHasNecessaryCreds } = useCreds();
  const hasNecessaryCreds = getHasNecessaryCreds(params.proofType);
  const sessionId = searchParams.get('sessionId');
  const callbackUrl = searchParams.get('callback');

  const sessionQuery = useQuery(['getSession'], {
    queryFn: async () => {
      if (!sessionId) return;
      const resp = await fetch(`${clientPortalUrl}/api/sessions/${sessionId}`);
      return (await resp.json()) as { sessionId: string; error: any };
    },
    enabled: !!sessionId
  });

  // 3. Redirect user to callback URL & include proof in query params
  const isInvalidSession = useMemo(
    () =>
      !!sessionId &&
      sessionQuery.isSuccess &&
      sessionQuery.data?.sessionId !== sessionId,
    [sessionId, sessionQuery.isSuccess, sessionQuery.data?.sessionId]
  );

  const errorMessage = useMemo(() => {
    if (!(sessionId ?? callbackUrl)) return 'Missing sessionId and callback';
    if (sessionQuery.isError) return 'Failed to get session';
    if (sessionQuery.data?.error)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `Failed to get session: ${sessionQuery.data.error}`;
    if (sessionQuery.isSuccess && sessionQuery.data?.sessionId !== sessionId)
      return 'Invalid sessionId';
  }, [sessionId, callbackUrl]);

  return {
    proof: null,
    errorMessage,
    proofName: proofs[params.proofType].name,
    hasNecessaryCreds,
    sessionQuery,
    isInvalidSession,
    handleSubmit() {
      if (
        sessionQuery.isError ||
        !sessionQuery?.data ||
        sessionQuery?.isError ||
        !proof
      )
        return;
      // Redirect user to callback URL & include proof in query params
      const proofString = encodeURIComponent(JSON.stringify(proof));
      // TODO: Encrypt (at least part of) proof using client's public encryption key
      window.location.href = `${callbackUrl}?proof=${proofString}`;
    }
  };
};

const Proofs = () => {
  const { proof, hasNecessaryCreds, handleSubmit, proofName, errorMessage } =
    useHook();
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
        <h2>Prove {proofName}</h2>
        <div className="spacer-med" />
        <br />
        {errorMessage ? (
          <p style={{ color: 'red', fontSize: '1rem' }}>
            Error: {errorMessage}
          </p>
        ) : hasNecessaryCreds ? (
          <p>
            This will generate a proof showing only this one attribute of you:{' '}
            <code>{proofName}</code>. It may take 5-15 seconds to load.
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
        {hasNecessaryCreds ? (
          proof ? (
            <button className="x-button" onClick={handleSubmit}>
              Submit proof
            </button>
          ) : (
            <LoadingProofsButton />
          )
        ) : (
          ''
        )}
      </div>
    </RoundedWindow>
  );
};

export default Proofs;
