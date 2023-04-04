import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createVeriffFrame, MESSAGES } from "@veriff/incontext-sdk";
import { useQuery } from "@tanstack/react-query";
import FinalStep from "./FinalStep";
import StepSuccess from "./StepSuccess";
import VerificationContainer from "./IssuanceContainer";
import { useGovernmentIDIssuanceState } from "./useGovernmentIDIssuanceState";
import { getRetrivalEndpointForVeriffSessionId, getVeriffSession } from "../../id-server";

const StepIDV = () => {
	const navigate = useNavigate();
	const veriffSessionQuery = useQuery({
		queryKey: ["veriffSession"],
		queryFn: getVeriffSession,
	});

	useEffect(() => {
		if (!veriffSessionQuery.data?.url) return;

		const verification = veriffSessionQuery.data;
		const handleVeriffEvent = (msg: MESSAGES) => {
			if (msg === MESSAGES.FINISHED && verification.id) {
				const encodedRetrievalEndpoint = encodeURIComponent(
					window.btoa(getRetrivalEndpointForVeriffSessionId(verification.id)),
				);
				navigate(
					`/issuance/idgov/store?retrievalEndpoint=${encodedRetrievalEndpoint}`,
				);
			}
		};
		createVeriffFrame({
			url: verification.url,
			onEvent: handleVeriffEvent,
		});
	}, [veriffSessionQuery]);

	return (
		<>
			<h3 style={{ marginBottom: "25px", marginTop: "-25px" }}>
				Verify your ID
			</h3>
		</>
	);
};

const ConfirmRetry = ({
	setRetry,
	retrievalEndpoint,
}: {
	setRetry: (retry: boolean) => void;
	retrievalEndpoint: string;
}) => (
	<div style={{ textAlign: "center" }}>
		<h2>Skip verification?</h2>
		<p>We noticed you have verified yourself already.</p>
		<p>Would you like to skip to the Store step?</p>
		<div style={{ display: "flex", flex: "flex-row", marginTop: "20px" }}>
			<button
				className="export-private-info-button"
				style={{
					lineHeight: "1",
					fontSize: "16px",
				}}
				onClick={() => setRetry(false)}
			>
				No, I want to verify again
			</button>
			<div style={{ margin: "10px" }} />
			<button
				className="x-button"
				style={{
					lineHeight: "1",
					fontSize: "16px",
				}}
				onClick={() => {
					const encodedRetrievalEndpoint = encodeURIComponent(
						window.btoa(retrievalEndpoint),
					);
					window.location.href = `/issuance/idgov/store?retrievalEndpoint=${encodedRetrievalEndpoint}`;
				}}
			>
				Yes
			</button>
		</div>
	</div>
);

const GovernmentIDIssuance = () => {
	const navigate = useNavigate();
	const {
		success,
		setSuccess,
		onConfirmOverwrite,
		onDenyOverwrite,
		retry,
		setRetry,
		currentIdx,
		steps,
		currentStep,
		retrievalEndpoint,
	} = useGovernmentIDIssuanceState();

	useEffect(() => {
		if (success && window.localStorage.getItem("register-credentialType")) {
			navigate(
				`/register?credentialType=${window.localStorage.getItem(
					"register-credentialType",
				)}&proofType=${window.localStorage.getItem(
					"register-proofType",
				)}&callback=${window.localStorage.getItem("register-callback")}`,
			);
		}
	}, [success]);
	return (
		<VerificationContainer steps={steps} currentIdx={currentIdx}>
			{success ? (
				<StepSuccess />
			) : retry && currentStep !== "Finalize" ? (
				<ConfirmRetry
					setRetry={setRetry}
					retrievalEndpoint={retrievalEndpoint}
				/>
			) : currentStep === "Verify" ? (
				<StepIDV /> // currentStep === "Finalize" ? (
			) : (
				<FinalStep
					onSuccess={setSuccess}
					loadingMessage={""}
					onConfirmOverwrite={onConfirmOverwrite}
					onDenyOverwrite={onDenyOverwrite}
				/>
			)}
		</VerificationContainer>
	);
};

export default GovernmentIDIssuance;
