import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "wagmi";
import { 
  clientPortalUrl, 
} from "../../constants";
// import residencyStoreABI from "../constants/abi/zk-contracts/ResidencyStore.json";
// import antiSybilStoreABI from "../constants/abi/zk-contracts/AntiSybilStore.json";
import { Oval } from "react-loader-spinner";
import RoundedWindow from "../RoundedWindow";
import useGenericProofsState from "./useGenericProofsState";

const CustomOval = () => (
	<Oval
		height={10}
		width={10}
		color="#464646"
		wrapperStyle={{ marginLeft: "5px" }}
		wrapperClass=""
		visible={true}
		ariaLabel="oval-loading"
		secondaryColor="#01010c"
		strokeWidth={2}
		strokeWidthSecondary={2}
	/>
)

// @ts-expect-error TS(7006): Parameter 'props' implicitly has an 'any' type.
const LoadingProofsButton = (props) => (
	<button className="x-button" onClick={props.onClick}>
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			Proof Loading
			<CustomOval />
		</div>
	</button>
);


const Proofs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
	const {
    params,
    proofs,
    hasNecessaryCreds,
    proof,
    error,
		setError,
  } = useGenericProofsState();

  const sessionQuery = useQuery(
    ["getSession"],
    // @ts-expect-error TS(2345): Argument of type '() => Promise<any>' is not assig... Remove this comment to see the full error message
    async () => {
      try {
        if (!searchParams.get("sessionId")) return { error: "No session id" };
        const sessionId = searchParams.get("sessionId");
        const resp = await fetch(`${clientPortalUrl}/api/sessions/${sessionId}`);
        return await resp.json();
      } catch (err) {
        console.error(err)
        return { error: err };
      }
    },
    {
    refetchOnWindowFocus: false,
    onError: (err) => {
      console.error(err);
    }
    // enabled:
    // onSuccess:
    // onError:
  });

  // Steps:
  // 1. Ensure sessionId and callback params are present
  // 2. Ensure sessionId is valid
  // 3. Redirect user to callback URL & include proof in query params

  useEffect(() => {
    (async () => {
      // Get sessionId and callback from URL
      const sessionId = searchParams.get("sessionId");
      const callbackUrl = searchParams.get("callback");
      // @ts-expect-error TS(2345): Argument of type '{ message: string; }' is not ass... Remove this comment to see the full error message
      if (!(sessionId || callbackUrl)) setError({ message: "Missing sessionId and callback" });
      // @ts-expect-error TS(2345): Argument of type '{ message: string; }' is not ass... Remove this comment to see the full error message
      if (!sessionId) setError({ message: "Missing sessionId" });
      // @ts-expect-error TS(2345): Argument of type '{ message: string; }' is not ass... Remove this comment to see the full error message
      if (!callbackUrl) setError({ message: "Missing callback" });
      else if (sessionId && callbackUrl) {
        try {
          console.log('sessionQuery.data before refetch', sessionQuery.data)
          if (!sessionQuery.data) await sessionQuery.refetch() // manually call queryFn
          console.log('sessionQuery.data after refetch', sessionQuery.data)
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          const returnedSessionId = sessionQuery?.data?.sessionId;
          // @ts-expect-error TS(2345): Argument of type '{ message: string; }' is not ass... Remove this comment to see the full error message
          if (!returnedSessionId) setError({ message: "Invalid sessionId" });
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          else if (sessionQuery?.data.error) setError(sessionQuery?.data?.error?.message);
        } catch (err) {
          console.error(err)
          // @ts-expect-error TS(2345): Argument of type '{ message: string; }' is not ass... Remove this comment to see the full error message
          setError({ message: "Invalid sessionId" });
        }
      }
    })()
  }, [sessionQuery?.data]);

  function handleSubmit() {
    if (error || !sessionQuery?.data || sessionQuery?.isError || !proof) return;
    // Redirect user to callback URL & include proof in query params
    const callback = searchParams.get("callback");
    const proofString = encodeURIComponent(JSON.stringify(proof));
    // TODO: Encrypt (at least part of) proof using client's public encryption key
    window.location.href = `${callback}?proof=${proofString}`;
  }


  return (
		<RoundedWindow>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
// @ts-expect-error TS(2538): Type 'undefined' cannot be used as an index type.
				<h2>Prove {proofs[params.proofType].name}</h2>
				<div className="spacer-med" />
				<br />
// @ts-expect-error TS(2339): Property 'message' does not exist on type 'never'.
				{error?.message ? (
// @ts-expect-error TS(2339): Property 'message' does not exist on type 'never'.
					<p style={{ color: "red", fontSize: "1rem" }}>Error: {error.message}</p>
				) : hasNecessaryCreds ? (
					<p>
						This will generate a proof showing only this one attribute of you:{" "}
            // @ts-expect-error TS(2538): Type 'undefined' cannot be used as an index type.
            <code>{proofs[params.proofType].name}</code>. It may take 5-15 seconds to load.
					</p>
				) : (
					<p>
						&nbsp;Note: You cannot generate this proof without the necessary credentials. If
						you have not already, please{" "}
						{/* TODO: Get specific. Tell the user which credentials they need to get/verify. */}
						<a href="/issuance" style={{ color: "#fdc094" }}>
							verify yourself
						</a>
						.
					</p>
				)}
				<div className="spacer-med" />
				<br />
				{hasNecessaryCreds ? (
					proof ? (
						<button
							className="x-button"
							onClick={handleSubmit}
						>
              Submit proof
						</button>
					) : (
						<LoadingProofsButton />
					)
				) : (
					""
				)}
			</div>
		</RoundedWindow>
  );
};

export default Proofs;
