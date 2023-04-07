import { Node } from "@zk-kit/incremental-merkle-tree";
import { ethers } from "ethers";
import { SerializedCreds } from "../../types";
import { GetMerkleProofParamsResult } from "../getMerkleProofParams";
import { poseidonTwoInputs } from "../zokrates";

export async function getProofOfResidency({
	sender,
	govIdCreds,
	mp,
	leaf,
}: {
	sender: string;
	govIdCreds: {
		creds: {
			newSecret: string;
			serializedAsNewPreimage: SerializedCreds;
		};
	};
	mp: GetMerkleProofParamsResult;
	leaf: Node;
}) {
	const [
		issuer,
		newSecret,
		countryCode,
		nameCitySubdivisionZipStreetHash,
		completedAt,
		scope,
	] = govIdCreds.creds.serializedAsNewPreimage;
	const salt =
		"18450029681611047275023442534946896643130395402313725026917000686233641593164";
	const footprint = await poseidonTwoInputs([
		salt,
		ethers.BigNumber.from(govIdCreds.creds.newSecret).toString(),
	]);
	return [
		mp.root,
		ethers.BigNumber.from(sender).toString(),
		ethers.BigNumber.from(issuer).toString(),
		salt,
		footprint,
		ethers.BigNumber.from(countryCode).toString(),
		ethers.BigNumber.from(nameCitySubdivisionZipStreetHash).toString(),
		ethers.BigNumber.from(completedAt).toString(),
		ethers.BigNumber.from(scope).toString(),
		ethers.BigNumber.from(newSecret).toString(),
		leaf,
		mp.path,
		mp.indices,
	];
}
