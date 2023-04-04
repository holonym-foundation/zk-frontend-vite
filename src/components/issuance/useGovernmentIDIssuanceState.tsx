import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { idServerUrl } from "../../constants";
import { getRetrivalEndpointForVeriffSessionId } from '../../id-server';

const steps = ["Verify", "Finalize"];

export function useGovernmentIDIssuanceState() {
	const { store } = useParams();
	const [success, setSuccess] = useState<boolean>();
	const veriffSessionId = useMemo(
		() => localStorage.getItem("veriff-sessionId"),
		[],
	);

	const [retry, setRetry] = useState<boolean>(!!veriffSessionId);

	const retrievalEndpoint = getRetrivalEndpointForVeriffSessionId(veriffSessionId);
	const currentStep = useMemo(() => (!store ? "Verify" : "Finalize"), [store]);
	const currentIdx = useMemo(() => steps.indexOf(currentStep), [currentStep]);
	return {
		success,
		setSuccess: () => setSuccess(true),
		retry,
		setRetry,
		currentIdx,
		steps,
		currentStep,
		retrievalEndpoint,
		onConfirmOverwrite: () => {
			setRetry(true);
			setSuccess(false);
		},
		onDenyOverwrite: () => {
			setRetry(true);
		},
	};
}
