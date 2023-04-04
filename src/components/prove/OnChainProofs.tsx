import { useNavigate } from "react-router-dom";
// import residencyStoreABI from "../constants/abi/zk-contracts/ResidencyStore.json";
// import antiSybilStoreABI from "../constants/abi/zk-contracts/AntiSybilStore.json";
import { Oval } from "react-loader-spinner";
import { useQuery } from "wagmi";
import { Success } from "../success";
import { truncateAddress } from "../../utils/ui-helpers";
import RoundedWindow from "../RoundedWindow";
import { useProofMetadata } from "../../context/ProofMetadata";
import { defaultChainToProveOn } from "../../constants";
import Relayer from "../../utils/relayer";
import useGenericProofsState from "./useGenericProofsState";

const SUBMIT_PROOF = 'submitProof';

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
	const navigate = useNavigate();
	const {
    params,
    proofs,
		alreadyHasSBT,
    accountReadyAddress,
    hasNecessaryCreds,
    proof,
    submissionConsent,
    setSubmissionConsent,
    proofSubmissionSuccess,
		setProofSubmissionSuccess,
    error,
		setError,
  } = useGenericProofsState();
// @ts-expect-error TS(2339): Property 'addProofMetadataItem' does not exist on ... Remove this comment to see the full error message
	const { addProofMetadataItem } = useProofMetadata();

	const submitProofQuery = useQuery(
		["submitProof"],
// @ts-expect-error TS(2345): Argument of type '() => Promise<any>' is not assig... Remove this comment to see the full error message
		async () => {
      // @ts-expect-error TS(2554): Expected 5 arguments, but got 3.
      return await Relayer.prove(
        proof,
// @ts-expect-error TS(2538): Type 'undefined' cannot be used as an index type.
				proofs[params.proofType].contractName,
        defaultChainToProveOn,
      );
    },
		{
			enabled: !!(submissionConsent && proof),
			onSuccess: (result) => {
        console.log('result from submitProof')
        console.log(result)
// @ts-expect-error TS(2571): Object is of type 'unknown'.
				if (result.error) {
					console.log("error", result);
					setError({
            // @ts-expect-error TS(2345): Argument of type '{ type: string; message: any; }'... Remove this comment to see the full error message
            type: SUBMIT_PROOF,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            message: result?.error?.response?.data?.error?.reason ??
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            result?.error?.message,
          });
				} else {
					addProofMetadataItem(
						result,
// @ts-expect-error TS(2532): Object is possibly 'undefined'.
						proof.inputs[1],
						params.proofType,
						params.actionId,
					);
          setProofSubmissionSuccess(true);
        }
			},
			onError: (error) => {
				console.log("error", error);
				setError({
// @ts-expect-error TS(2345): Argument of type '{ type: string; message: any; }'... Remove this comment to see the full error message
					type: SUBMIT_PROOF,
// @ts-expect-error TS(2571): Object is of type 'unknown'.
					message: error?.response?.data?.error?.reason ?? error?.message,
				});
			}
		},
	);

	if (proofSubmissionSuccess) {
		if (params.callback) window.location.href = `https://${params.callback}`;
		if (window.localStorage.getItem('register-proofType')) {
			navigate(`/register?credentialType=${window.localStorage.getItem('register-credentialType')}&proofType=${window.localStorage.getItem('register-proofType')}&callback=${window.localStorage.getItem('register-callback')}`)
		}
		return <Success title="Success" />;
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
					<p>Error: {error.message}</p>
				) : alreadyHasSBT ? (
					<p>
						You already have a soul-bound token (SBT) for this attribute.
					</p>
				) : hasNecessaryCreds ? (
					<p>
						This will give you,
						<code> {truncateAddress(accountReadyAddress)} </code>, a{" "}
						<a
							target="_blank"
							rel="noreferrer"
							href="https://cointelegraph.com/news/what-are-soulbound-tokens-sbts-and-how-do-they-work"
							style={{ color: "#fdc094" }}
						>
							soul-bound token
						</a>{" "}
						(SBT) showing only this one attribute of you:{" "}
// @ts-expect-error TS(2538): Type 'undefined' cannot be used as an index type.
						<code>{proofs[params.proofType].name}</code>. It may take 5-15
						seconds to load.
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
				{!alreadyHasSBT && hasNecessaryCreds ? (
					proof ? (
						<button
							className="x-button"
							onClick={() => setSubmissionConsent(true)}
						>
							{submissionConsent && submitProofQuery.isFetching
								? (
										<div
											style={{
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											Submitting
											<CustomOval />
										</div>
									)
								: "Submit proof"}
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
