import { PropsWithChildren, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import RoundedWindow from "./RoundedWindow";
import ConnectWalletScreen from "./atoms/connect-wallet-screen";
import { useHoloAuthSig } from "../context/HoloAuthSig";
import { useHoloKeyGenSig } from "../context/HoloKeyGenSig";
import { holonymAuthMessage, holonymKeyGenMessage } from "../constants";

const SignatureContainer = ({ children }: PropsWithChildren) => {
	const { data: account } = useAccount();
	const {
		// @ts-expect-error TS(2339): Property 'signHoloAuthMessage' does not exist on t... Remove this comment to see the full error message
		signHoloAuthMessage,
		// @ts-expect-error TS(2339): Property 'holoAuthSigIsError' does not exist on ty... Remove this comment to see the full error message
		holoAuthSigIsError,
		// @ts-expect-error TS(2339): Property 'holoAuthSigIsLoading' does not exist on ... Remove this comment to see the full error message
		holoAuthSigIsLoading,
		// @ts-expect-error TS(2339): Property 'holoAuthSigIsSuccess' does not exist on ... Remove this comment to see the full error message
		holoAuthSigIsSuccess,
		// @ts-expect-error TS(2339): Property 'holoAuthSig' does not exist on type 'nul... Remove this comment to see the full error message
		holoAuthSig,
		// @ts-expect-error TS(2339): Property 'holoAuthSigDigest' does not exist on typ... Remove this comment to see the full error message
		holoAuthSigDigest,
		// @ts-expect-error TS(2339): Property 'clearHoloAuthSig' does not exist on type... Remove this comment to see the full error message
		clearHoloAuthSig,
	} = useHoloAuthSig();
	const {
		// @ts-expect-error TS(2339): Property 'signHoloKeyGenMessage' does not exist on... Remove this comment to see the full error message
		signHoloKeyGenMessage,
		// @ts-expect-error TS(2339): Property 'holoKeyGenSigIsError' does not exist on ... Remove this comment to see the full error message
		holoKeyGenSigIsError,
		// @ts-expect-error TS(2339): Property 'holoKeyGenSigIsLoading' does not exist o... Remove this comment to see the full error message
		holoKeyGenSigIsLoading,
		// @ts-expect-error TS(2339): Property 'holoKeyGenSigIsSuccess' does not exist o... Remove this comment to see the full error message
		holoKeyGenSigIsSuccess,
		// @ts-expect-error TS(2339): Property 'holoKeyGenSig' does not exist on type 'n... Remove this comment to see the full error message
		holoKeyGenSig,
		// @ts-expect-error TS(2339): Property 'holoKeyGenSigDigest' does not exist on t... Remove this comment to see the full error message
		holoKeyGenSigDigest,
		// @ts-expect-error TS(2339): Property 'clearHoloKeyGenSig' does not exist on ty... Remove this comment to see the full error message
		clearHoloKeyGenSig,
	} = useHoloKeyGenSig();

	useEffect(
		() => {
			if (!(account?.address && account?.connector)) return;
			if (!(holoAuthSig || holoAuthSigIsLoading || holoAuthSigIsSuccess)) {
				signHoloAuthMessage().catch((err: $TSFixMe) => console.error(err));
			}
			if (
				!(
					holoAuthSigIsLoading ||
					holoKeyGenSig ||
					holoKeyGenSigIsLoading ||
					holoKeyGenSigIsSuccess
				)
			) {
				signHoloKeyGenMessage().catch((err: $TSFixMe) => console.error(err));
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
		],
	);

	useEffect(() => {
		if (!(account?.address && account?.connector)) return;
		// Check that sigs are from account. If they aren't, re-request them
		if (
			holoAuthSig &&
			ethers.utils.verifyMessage(holonymAuthMessage, holoAuthSig) !==
				account.address
		) {
			console.log("account changed. Re-retrieving holoAuthSig");
			clearHoloAuthSig();
			signHoloAuthMessage().catch((err: $TSFixMe) => console.error(err));
		}
		if (
			holoKeyGenSig &&
			ethers.utils.verifyMessage(holonymKeyGenMessage, holoKeyGenSig) !==
				account.address
		) {
			console.log("account changed. Re-retrieving holoKeyGenSig");
			clearHoloKeyGenSig();
			signHoloKeyGenMessage().catch((err: $TSFixMe) => console.error(err));
		}
	}, [account]);

	return (
		<>
			{!(account?.address && account?.connector) ? (
				<RoundedWindow>
					<ConnectWalletScreen />
				</RoundedWindow>
			) : !(holoAuthSigDigest && holoKeyGenSigDigest) ? (
				<RoundedWindow>
					<div
						style={{
							position: "relative",
							paddingTop: "100px",
							width: "100%",
							height: "90%",
							display: "flex",
							alignItems: "center",
							justifyContent: "start",
							flexDirection: "column",
						}}
					>
						<h2>Please sign the messages in your wallet.</h2>
					</div>
				</RoundedWindow>
			) : (
				<>{children}</>
			)}
		</>
	);
};

export default SignatureContainer;
