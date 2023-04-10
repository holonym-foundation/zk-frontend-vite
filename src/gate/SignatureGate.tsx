import React, { PropsWithChildren } from "react";
import useSignatureGate from "./useSignatureGate";

export default function SignatureGate({
	children,
	fallback,
	gate
}: PropsWithChildren<{
	fallback: React.ReactNode;
	gate: (data: unknown) => boolean;

}>) {
	const isGateOpen = useSignatureGate(gate);
	if (isGateOpen) {
		return <>{children}</>;
	}
	return fallback;
}
