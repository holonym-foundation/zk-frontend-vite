import React from "react";
import useSignatureGate from "./useSignatureGate";

export default function SignatureGate({
    children,
    fallback,
    gate
// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
}: $TSFixMe) {
	const isGateOpen = useSignatureGate(gate);
	if (isGateOpen) {
		return <>{children}</>;
	}
	return fallback;
}
