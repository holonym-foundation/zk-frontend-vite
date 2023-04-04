/**
 * Simple provider component & hook to store the Holo KeyGen sig (and sigDigest) in
 * context so that it doesn't have to be passed as props to every component
 */
import React, {
	createContext,
	PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { useSignMessage } from "wagmi";
import { useLocalStorage } from "usehooks-ts";
import { sha256 } from "../utils/secrets";
import { holonymKeyGenMessage } from "../constants";

const HoloKeyGenSigContext = createContext<{
	signHoloKeyGenMessage: () => Promise<void>;
	holoKeyGenSigIsError: boolean;
	holoKeyGenSigIsLoading: boolean;
	holoKeyGenSigIsSuccess: boolean;
	holoKeyGenSig: string;
	holoKeyGenSigDigest: string;
	clearHoloKeyGenSig: () => void;
} | null>(null);

function HoloKeyGenSigProvider({ children }: PropsWithChildren) {
	const [holoKeyGenSig, setHoloKeyGenSig] = useLocalStorage(
		"holoKeyGenSig",
		"",
	);
	const [holoKeyGenSigDigest, setHoloKeyGenSigDigest] = useLocalStorage(
		"holoKeyGenSigDigest",
		"",
	);
	// Using useLocalStorage on strings results in double quotes being added to the ends of the strings
	const parsedHoloKeyGenSig = useMemo(
		() => holoKeyGenSig?.replaceAll('"', ""),
		[holoKeyGenSig],
	);
	const parsedHoloKeyGenSigDigest = useMemo(
		() => holoKeyGenSigDigest?.replaceAll('"', ""),
		[holoKeyGenSigDigest],
	);
	const {
		data: signedKeyGenMessage,
		isError: holoKeyGenSigIsError,
		isLoading: holoKeyGenSigIsLoading,
		isSuccess: holoKeyGenSigIsSuccess,
		signMessageAsync,
	} = useSignMessage({ message: holonymKeyGenMessage });

	async function signHoloKeyGenMessage() {
		console.log("requesting holoKeyGenSig");
		const signedMessage = await signMessageAsync();
		setHoloKeyGenSig(signedMessage);
		const digest = await sha256(signedMessage);
		setHoloKeyGenSigDigest(digest);
	}

	function clearHoloKeyGenSig() {
		setHoloKeyGenSig("");
		setHoloKeyGenSigDigest("");
	}

	return (
		<HoloKeyGenSigContext.Provider
			value={{
				signHoloKeyGenMessage,
				holoKeyGenSigIsError,
				holoKeyGenSigIsLoading,
				holoKeyGenSigIsSuccess,
				holoKeyGenSig: parsedHoloKeyGenSig,
				holoKeyGenSigDigest: parsedHoloKeyGenSigDigest,
				clearHoloKeyGenSig,
			}}
		>
			{children}
		</HoloKeyGenSigContext.Provider>
	);
}

// Helper hook to access the provider values
const useHoloKeyGenSig = () => {
	const value = useContext(HoloKeyGenSigContext);
	if (value === null) {
		throw new Error(
			"useHoloKeyGenSig called withing a component that is not withing the HoloKeyGenSigProvider",
		);
	}
	return value;
};

export { HoloKeyGenSigProvider, useHoloKeyGenSig };
