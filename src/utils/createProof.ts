import { loadMerkleProofParams } from "./getMerkleProofParams";
import {
	computeWitness,
	generateProof,
} from "./zokrates";
import {
	getMedicalSpecialty,
	getSybilPhone,
	getKnowledgeOfLeafPreimage,
	getGovIdFirstNameLastName,
	getProofOfResidency,
	getAntiSybil,
} from './circuits'

export const mappings = {
	medicalSpecialty: getMedicalSpecialty,
	proofOfResidency: getProofOfResidency,
	antiSybil: getAntiSybil,
	sybilPhone: getSybilPhone,
	knowledgeOfLeafPreimage: getKnowledgeOfLeafPreimage,
	govIdFirstNameLastName: getGovIdFirstNameLastName,
} as const;

export type CircuitFn<T extends keyof typeof mappings> = typeof mappings[T];
type CreateProofArgs<T extends keyof typeof mappings> = Parameters<
	CircuitFn<T>
>[0];
export type CreateProofCircuitArgs<T extends keyof typeof mappings> = Omit<
	CreateProofArgs<T>,
	"mp" | "leaf"
>;

export async function createProof<
	T extends keyof typeof mappings,
	A extends CreateProofCircuitArgs<T>,
	F extends CircuitFn<T>,
>(circuit: T, args: A, leafParams: []) {
	const fn = mappings[circuit] as F;
	const { leaf, mp } = await loadMerkleProofParams(leafParams, circuit);
	return generateProof(
		circuit,
		computeWitness(
			circuit,
			// @ts-expect-error ts(2345)
			await fn({
				...args,
				leaf,
				mp,
			}),
		).witness,
	);
}
