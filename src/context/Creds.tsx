/**
 * Context provider for creds.
 */
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	PropsWithChildren,
} from "react";
import { useSessionStorage } from "usehooks-ts";
import { getCredentials, storeCredentials } from "../utils/secrets";
import { useHoloAuthSig } from "./HoloAuthSig";
import { useHoloKeyGenSig } from "./HoloKeyGenSig";

const CredsContext = createContext<{
	sortedCreds: $TSFixMe;
	loadingCreds: boolean;
	reloadCreds: () => Promise<$TSFixMe>;
	storeCreds: (sortedCreds: $TSFixMe, kolpProof: $TSFixMe) => Promise<$TSFixMe>;
} | null>(null);

function CredsProvider({ children }: PropsWithChildren) {
	// TODO: Maybe use a mutex here to prevent multiple places from updating creds at the same time.
	// This is incredibly important at the end of the verification flow when the creds are being updated, and
	// the store-credentials and glowy-green-button components need to have the highest write privileges.
	// OR: Maybe use a hot/cold storage system where the cold storage (i.e., localStorage and remote backup)
	// is only updated infrequently and when we are absolutely sure we want to make the update.
	// OR: Maybe use a mutex and a hot/cold storage system together. Use the mutex for cold storage.
	const [sortedCreds, setSortedCreds] = useSessionStorage("sorted-creds", []);
	const [loadingCreds, setLoadingCreds] = useState(true);
	const { holoAuthSigDigest } = useHoloAuthSig();
	const { holoKeyGenSigDigest } = useHoloKeyGenSig();

	async function loadCreds() {
		setLoadingCreds(true);
		try {
			setSortedCreds(
				await getCredentials(holoKeyGenSigDigest, holoAuthSigDigest, false),
			);
			setLoadingCreds(false);
		} catch (error) {
			console.error(error);
			setLoadingCreds(false);
		}
	}

	useEffect(() => {
		// TODO: Use useQuery for this so that you only call this function once
		loadCreds();
	}, []);

	async function storeCreds(sortedCreds: $TSFixMe, kolpProof: $TSFixMe) {
		const result = await storeCredentials(
			sortedCreds,
			holoKeyGenSigDigest,
			holoAuthSigDigest,
			kolpProof,
		);
		await loadCreds();
		return result;
	}

	return (
		<CredsContext.Provider
			value={{
				sortedCreds,
				loadingCreds,
				reloadCreds: loadCreds,
				storeCreds,
			}}
		>
			{children}
		</CredsContext.Provider>
	);
}

// Helper hook to access the provider values
const useCreds = () => {
	const value = useContext(CredsContext);
	if (value === null) {
		throw new Error(
			"useCreds called withing a component that is not withing the CredsProvider",
		);
	}
	return value;
};

export { CredsProvider, useCreds };
