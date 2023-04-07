import { Node } from "@zk-kit/incremental-merkle-tree";
import { ethers } from "ethers";
import { SerializedCreds } from "../../types";
import { GetMerkleProofParamsResult } from "../getMerkleProofParams";
import { poseidonTwoInputs } from "../zokrates";

const salt =
	"320192098064396900878317978103229380372186908085604549333845693700248653086";

export async function getMedicalSpecialty({
	sender,
	medicalCreds,
	mp,
	leaf,
}: {
	sender: string | undefined;
	medicalCreds: {
		creds: {
			newSecret: string;
			serializedAsNewPreimage: SerializedCreds;
		};
	};
	mp: GetMerkleProofParamsResult;
	leaf: Node;
}) {
	const [issuer, newSecret, specialty, npiNumLicenseMedCredsHash, iat, scope] =
		medicalCreds.creds.serializedAsNewPreimage;
	return [
		mp.root,
		ethers.BigNumber.from(sender).toString(),
		ethers.BigNumber.from(issuer).toString(),
		ethers.BigNumber.from(specialty).toString(),
		salt,
		await poseidonTwoInputs([
			salt,
			ethers.BigNumber.from(medicalCreds.creds.newSecret).toString(),
		]),
		leaf,
		ethers.BigNumber.from(npiNumLicenseMedCredsHash).toString(),
		ethers.BigNumber.from(iat).toString(),
		ethers.BigNumber.from(scope).toString(),
		ethers.BigNumber.from(newSecret).toString(),
		mp.path,
		mp.indices,
	];
}
