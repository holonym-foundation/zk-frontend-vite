import { useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useHoloAuthSig } from "../context/HoloAuthSig";
import { useHoloKeyGenSig } from "../context/HoloKeyGenSig";
import { holonymAuthMessage, holonymKeyGenMessage } from "../constants";

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export default function useSignatureGate(gate: $TSFixMe) {
	const { data: account } = useAccount();
	const {
// @ts-expect-error TS(2339): Property 'signHoloAuthMessage' does not exist on t... Remove this comment to see the full error message
		signHoloAuthMessage, holoAuthSigIsError, holoAuthSigIsLoading, holoAuthSigIsSuccess, holoAuthSig, holoAuthSigDigest, clearHoloAuthSig,
	} = useHoloAuthSig();
	const {
// @ts-expect-error TS(2339): Property 'signHoloKeyGenMessage' does not exist on... Remove this comment to see the full error message
		signHoloKeyGenMessage, holoKeyGenSigIsError, holoKeyGenSigIsLoading, holoKeyGenSigIsSuccess, holoKeyGenSig, holoKeyGenSigDigest, clearHoloKeyGenSig,
	} = useHoloKeyGenSig();

	useEffect(
		() => {
			if (!(account?.address && account?.connector))
				return;
			if (!((holoAuthSig ||holoAuthSigIsLoading ) ||holoAuthSigIsSuccess)) {
// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
				signHoloAuthMessage().catch((err) => console.error(err));
			}
			if (!(((holoAuthSigIsLoading ||holoKeyGenSig ) ||holoKeyGenSigIsLoading ) ||holoKeyGenSigIsSuccess)) {
// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
				signHoloKeyGenMessage().catch((err) => console.error(err));
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			account,
			holoAuthSigIsError,
			holoAuthSigIsLoading,
			holoAuthSigIsSuccess,
			holoKeyGenSigIsError,
			holoKeyGenSigIsLoading,
			holoKeyGenSigIsSuccess,
		]
	);

	useEffect(() => {
		if (!(account?.address && account?.connector))
			return;
		// Check that sigs are from account. If they aren't, re-request them
		if (holoAuthSig &&
			ethers.utils.verifyMessage(holonymAuthMessage, holoAuthSig) !==
			account.address) {
			console.log("account changed. Re-retrieving holoAuthSig");
			clearHoloAuthSig();
// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
			signHoloAuthMessage().catch((err) => console.error(err));
		}
		if (holoKeyGenSig &&
			ethers.utils.verifyMessage(holonymKeyGenMessage, holoKeyGenSig) !==
			account.address) {
			console.log("account changed. Re-retrieving holoKeyGenSig");
			clearHoloKeyGenSig();
// @ts-expect-error TS(7006): Parameter 'err' implicitly has an 'any' type.
			signHoloKeyGenMessage().catch((err) => console.error(err));
		}
	}, [account]);

	return gate({ holoAuthSig, holoAuthSigDigest, holoKeyGenSig, holoKeyGenSigDigest });
}
