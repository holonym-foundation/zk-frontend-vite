/**
 * Context provider for proof metadata (i.e., SBT metadata).
 */
import {
	createContext,
	useContext,
	useState,
	useEffect,
	PropsWithChildren,
} from "react";
import { useSessionStorage } from "usehooks-ts";
import { ProofMetadata, ProofType, Transaction } from "../types";
import {
	getProofMetadata,
	proofMetadataItemFromTx,
	addProofMetadataItem,
} from "../utils/secrets";
import { useHoloAuthSig } from "./HoloAuthSig";
import { useHoloKeyGenSig } from "./HoloKeyGenSig";

const ProofMetadataContext = createContext<{
	proofMetadata: ProofMetadata[];
	loadingProofMetadata: boolean;
	addProofMetadataItem: (
		tx: Transaction,
		senderAddress: string,
		proofType: ProofType,
		actionId: string,
	) => Promise<boolean>;
} | null>(null);

function ProofMetadataProvider({ children }: PropsWithChildren) {
	const [proofMetadata, setProofMetadata] = useSessionStorage<ProofMetadata[]>(
		"proof-metadata",
		[],
	);
	const [loadingProofMetadata, setLoadingProofMetadata] = useState(true);
	const { holoAuthSigDigest } = useHoloAuthSig();
	const { holoKeyGenSigDigest } = useHoloKeyGenSig();

	useEffect(() => {
		// TODO: Use useQuery for this so that you only call this function once
		getProofMetadata(holoKeyGenSigDigest, holoAuthSigDigest)
			.then((proofMetadata) => {
				setProofMetadata(proofMetadata);
				setLoadingProofMetadata(false);
			})
			.catch((error) => {
				console.error(error);
				setLoadingProofMetadata(false);
			});
	}, []);

	// TODO: Move calls to localStorage for storing proofMetadata out of secrets.js. Just use
	// useLocalStorage from within this provider. (Be sure to store the values under the same keys as secrets.js)
	async function addProofMetadataItemToContextAndBackup(
		tx: Transaction,
		senderAddress: string,
		proofType: ProofType,
		actionId: string,
	) {
		const proofMetadataItem = proofMetadataItemFromTx(
			tx,
			senderAddress,
			proofType,
			actionId,
		);
		setProofMetadata([...proofMetadata, proofMetadataItem]);
		return await addProofMetadataItem(
			proofMetadataItem,
			holoAuthSigDigest,
			holoKeyGenSigDigest,
		);
	}

	return (
		<ProofMetadataContext.Provider
			value={{
				proofMetadata,
				loadingProofMetadata,
				addProofMetadataItem: addProofMetadataItemToContextAndBackup,
			}}
		>
			{children}
		</ProofMetadataContext.Provider>
	);
}

// Helper hook to access the provider values
const useProofMetadata = () => {
	const value = useContext(ProofMetadataContext);
	if (value === null) {
		throw new Error(
			"useProofMetadata called withing a component that is not withing the ProofMetadataProvider",
		);
	}
	return value;
};

export { ProofMetadataProvider, useProofMetadata };
