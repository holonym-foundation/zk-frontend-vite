/**
 * Hook for managing state common to onChainProofs and offChainProofs.
 */
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { serverAddress } from "../../constants";
// import residencyStoreABI from "../constants/abi/zk-contracts/ResidencyStore.json";
// import antiSybilStoreABI from "../constants/abi/zk-contracts/AntiSybilStore.json";
import { useProofs } from "../../context/Proofs";
import { useProofMetadata } from "../../context/ProofMetadata";
import { useCreds } from "../../context/Creds";

const useProofsState = () => {
	const params = useParams();
	const [error, setError] = useState();
	const [proof, setProof] = useState();
	const [submissionConsent, setSubmissionConsent] = useState(false);
  const [proofSubmissionSuccess, setProofSubmissionSuccess] = useState(false);
	const { data: account } = useAccount();
// @ts-expect-error TS(2339): Property 'sortedCreds' does not exist on type 'nul... Remove this comment to see the full error message
	const { sortedCreds } = useCreds();
	const { 
// @ts-expect-error TS(2339): Property 'uniquenessProof' does not exist on type ... Remove this comment to see the full error message
		uniquenessProof,
// @ts-expect-error TS(2339): Property 'loadUniquenessProof' does not exist on t... Remove this comment to see the full error message
		loadUniquenessProof,
// @ts-expect-error TS(2339): Property 'loadingUniquenessProof' does not exist o... Remove this comment to see the full error message
		loadingUniquenessProof,
// @ts-expect-error TS(2339): Property 'uniquenessPhoneProof' does not exist on ... Remove this comment to see the full error message
		uniquenessPhoneProof,
// @ts-expect-error TS(2339): Property 'loadUniquenessPhoneProof' does not exist... Remove this comment to see the full error message
		loadUniquenessPhoneProof,
// @ts-expect-error TS(2339): Property 'loadingUniquenessPhoneProof' does not ex... Remove this comment to see the full error message
		loadingUniquenessPhoneProof,
// @ts-expect-error TS(2339): Property 'usResidencyProof' does not exist on type... Remove this comment to see the full error message
		usResidencyProof,
// @ts-expect-error TS(2339): Property 'loadUSResidencyProof' does not exist on ... Remove this comment to see the full error message
		loadUSResidencyProof,
// @ts-expect-error TS(2339): Property 'loadingUSResidencyProof' does not exist ... Remove this comment to see the full error message
		loadingUSResidencyProof,
// @ts-expect-error TS(2339): Property 'medicalSpecialtyProof' does not exist on... Remove this comment to see the full error message
		medicalSpecialtyProof,
// @ts-expect-error TS(2339): Property 'loadMedicalSpecialtyProof' does not exis... Remove this comment to see the full error message
		loadMedicalSpecialtyProof,
// @ts-expect-error TS(2339): Property 'loadingMedicalSpecialtyProof' does not e... Remove this comment to see the full error message
		loadingMedicalSpecialtyProof,
	} = useProofs();
// @ts-expect-error TS(2339): Property 'proofMetadata' does not exist on type 'n... Remove this comment to see the full error message
	const { proofMetadata } = useProofMetadata();
	const accountReadyAddress = useMemo(
		() => account?.connector?.ready && account?.address && account.address,
    [account]
	);
	const alreadyHasSBT = useMemo(
// @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
		() => proofMetadata.filter((item) => item.proofType === params.proofType).length > 0,
		[proofMetadata, params.proofType]
	);
	const hasNecessaryCreds = useMemo(() => {
		if (params.proofType === "us-residency" || params.proofType === "uniqueness") {
			return !!sortedCreds?.[serverAddress['idgov-v2']]?.creds;
		} else if (params.proofType === "uniqueness-phone") {
			return !!sortedCreds?.[serverAddress['phone-v2']]?.creds;
		} else if (params.proofType === "medical-specialty") {
			return !!sortedCreds?.[serverAddress['med']]?.creds;
		}
	}, [sortedCreds])

	const proofs = {
		"us-residency": {
			name: "US Residency",
			// contractName: "IsUSResident",
			contractName: "IsUSResidentV2",
		},
		uniqueness: {
			name: "Uniqueness (government ID)",
			// contractName: "SybilResistance",
			contractName: "SybilResistanceV2",
		},
		'uniqueness-phone': {
			name: "Uniqueness (phone number)",
			contractName: "SybilResistancePhone",
		},
		"medical-specialty": {
			name: "Medical Specialty",
			contractName: "MedicalSpecialty",
		},
	};

	// Steps:
	// 1. Get & set creds
	// 2. Get & set proof
	// 3. Submit proof tx

	useEffect(() => {
		if (params.proofType === "us-residency") {
			if (loadingUSResidencyProof) {
				// Set proof to null if proof is loading. This handles the case where a proof has already
				// been set in the state of this hook but proofs in context are being forced to reload.
				// Force reloads of proofs occur after adding a leaf to the Merkle tree.
// @ts-expect-error TS(2345): Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
				setProof(null);
			} else if (!(usResidencyProof || alreadyHasSBT)) {
				// loadUSResidencyProof(true);
			} else {
				setProof(usResidencyProof)
			}
		} else if (params.proofType === "uniqueness") {
			if (loadingUniquenessProof) {
// @ts-expect-error TS(2345): Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
				setProof(null);
			} else if (!(uniquenessProof || alreadyHasSBT)) {
				// loadUniquenessProof(true);
			} else {
				setProof(uniquenessProof)
			}
		} else if (params.proofType === "uniqueness-phone") {
			if (loadingUniquenessPhoneProof) {
// @ts-expect-error TS(2345): Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
				setProof(null);
			} else if (!(uniquenessPhoneProof || alreadyHasSBT)) {
				// loadUniquenessPhoneProof(true);
			} else {
				setProof(uniquenessPhoneProof)
			}
		} else if (params.proofType === "medical-specialty") {
			if (loadingMedicalSpecialtyProof) {
// @ts-expect-error TS(2345): Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
				setProof(null);
			} else if (!(medicalSpecialtyProof || alreadyHasSBT)) {
				// loadMedicalSpecialtyProof(true);
			} else {
				setProof(medicalSpecialtyProof)
			}
		}
	}, 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[
		params,
		uniquenessProof,
		loadingUniquenessProof,
		usResidencyProof,
		loadingUSResidencyProof,
		medicalSpecialtyProof,
		loadingMedicalSpecialtyProof
	])

  return {
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
  }
};

export default useProofsState;
