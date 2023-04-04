import { ethers } from "ethers";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { defaultChainToProveOn, defaultActionId } from "../constants";
import assert from "assert";
import Relayer from "./relayer";
// @ts-ignore
import { groth16 } from "snarkjs";
import { MerkleProof, SerializedCreds } from "../types";
import {
	computeWitness,
	generateProof,
	loadArtifacts,
	loadProvingKey,
	poseidonHashQuinary,
	poseidonTwoInputs,
} from "./zokrates";

/**
 * Convert date string to unix timestamp
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsInt(date: `${number}-${number}-${number}`) {
	// Format input
	const [year] = date.split("-").map((x) => parseInt(x, 10));
	assert.ok(year >= 1900 && year < 2099); // Make sure date is in a reasonable range, otherwise it's likely the input was malformatted and it's best to be safe by stopping -- we can always allow more edge cases if needed later
	return new Date(date).getTime() / 1000 + 2208988800; // 2208988800000 is 70 year offset; Unix timestamps below 1970 are negative and we want to allow from approximately 1900.
}

/* Gets Merkle tree and creates Merkle proof */
export async function getMerkleProofParams(leaf: $TSFixMe) {
	const treeData = await Relayer.getTree(defaultChainToProveOn);
	// console.log(treeData, "treeData")
	const tree = new IncrementalMerkleTree(poseidonHashQuinary, 14, "0", 5);
	// NOTE: _nodes and _zeroes are private readonly variables in the `incremental-merkle-tree.d` file,
	// but the JavaScript implementation doesn't seem to enforce these constraints.
	// @ts-expect-error TS(2341): Property '_root' is private and only accessible wi... Remove this comment to see the full error message
	tree._root = treeData._root;
	// @ts-expect-error TS(2341): Property '_nodes' is private and only accessible w... Remove this comment to see the full error message
	tree._nodes = treeData._nodes;
	// @ts-expect-error TS(2341): Property '_zeroes' is private and only accessible ... Remove this comment to see the full error message
	tree._zeroes = treeData._zeroes;

	// @ts-expect-error TS(2341): Property '_nodes' is private and only accessible w... Remove this comment to see the full error message
	const leaves = tree._nodes[0];
	if (leaves.indexOf(leaf) === -1) {
		console.error("Could not find leaf in leaves");
		throw new Error("Leaf is not in Merkle tree");
	}

	const index = tree.indexOf(leaf);
	const merkleProof = tree.createProof(index);
	const [root_, leaf_, path_, indices_] = serializeProof(
		merkleProof,
		poseidonHashQuinary,
	);

	return {
		root: root_,
		leaf: leaf_,
		path: path_,
		indices: indices_,
	};
}

/**
 * (Forked from holo-merkle-utils)
 * Serializes createProof outputs to ZoKrates format
 */

export function serializeProof(
	proof: MerkleProof,
	hash: (input: string[]) => string,
) {
	// Insert the digest of the leaf at every level:
	let digest = proof.leaf;
	for (let i = 0; i < proof.siblings.length; i++) {
		proof.siblings[i].splice(proof.pathIndices[i], 0, digest);
		digest = hash(proof.siblings[i]);
	}

	// serialize
	const argify = (x: $TSFixMe) => ethers.BigNumber.from(x).toString();
	return [
		argify(proof.root),
		argify(proof.leaf),
		proof.siblings.map((x: $TSFixMe) => x.map((y: $TSFixMe) => argify(y))),
		proof.pathIndices.map((x: $TSFixMe) => argify(x)),
	];
}

/** Computes a poseidon hash of the input array
 * @param {Array<string>} serializedCreds All other values in the leaf's preimage, as an array of strings
 */
export async function createLeaf(serializedCreds: $TSFixMe) {
	await loadArtifacts("createLeaf");
	await loadProvingKey("createLeaf");
	const { output } = computeWitness("createLeaf", serializedCreds);
	return output.replaceAll('"', "");
}

// TODO: document what data parameter is
export async function onAddLeafProof(data: $TSFixMe) {
	const params = {
		pubKeyX: data.pubkey.x,
		pubKeyY: data.pubkey.y,
		R8x: data.signature.R8.x,
		R8y: data.signature.R8.y,
		S: data.signature.S,
		signedLeaf: data.leaf,
		newLeaf: data.newLeaf,
		signedLeafSecret: data.creds.secret,
		newLeafSecret: data.creds.newSecret,
		iat: data.creds.iat,
		customFields: data.creds.customFields,
		scope: data.creds.scope,
	};
	return await groth16.fullProve(
		params,
		"https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/onAddLeaf_js/onAddLeaf.wasm",
		"https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/onAddLeaf_0001.zkey",
	);
}

// /**
//  * @param {string} issuer Represents the issuer, at position 0 in the leaf's preimage
//  * @param {Array<string>} customFields All other values in the leaf's preimage, as an array of strings
//  * @param {string} oldSecret Represents the 16-byte secret, at position 5 in the old leaf's preimage. This is known by the user and issuer
//  * @param {string} newSecret Represents the 16-byte secret, at position 5 in the new leaf's preimage. This is known by the user (and not issuer)
//  */
// export async function onAddLeafProof(serializedCreds, newSecret) {
//   if (!zokProvider) {
//     const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
//     // TODO: Make this more sophisticated. Wait for zokProvider to be set or for timeout (e.g., 10s)
//     await sleep(5000);
//   }

//   const signedPreimage = serializedCreds;
//   // Replace the server-created secret with a secret only the user knows
//   const newPreimage = [serializedCreds[0], newSecret, ...serializedCreds.slice(2,6)];
//   const signedLeaf = await createLeaf(signedPreimage);
//   console.log("signed leaf", signedLeaf, signedPreimage);
//   const newLeaf = await createLeaf(newPreimage);
//   // When ordering the inputs to the circuit, i didn't think about how annoying this step will be if the orders are different! For now, much easier to keep it this way:
//   const reorderedSerializedCreds = [serializedCreds[0], serializedCreds[2], serializedCreds[3], serializedCreds[4], serializedCreds[5], serializedCreds[1]];
//   const args = [
//     ethers.BigNumber.from(signedLeaf).toString(),
//     ethers.BigNumber.from(newLeaf).toString(),
//     ...reorderedSerializedCreds,
//     ethers.BigNumber.from(newSecret).toString(),
//   ];
//   // onAddLeafArtifacts = onAddLeafArtifacts ? onAddLeafArtifacts : zokProvider.compile(onAddLeafArtifacts);
//   await loadArtifacts("onAddLeaf");
//   await loadProvingKey("onAddLeaf");

//   const { witness, output } = zokProvider.computeWitness(artifacts.onAddLeaf, args);

//   const proof = zokProvider.generateProof(
//     artifacts.onAddLeaf.program,
//     witness,
//     provingKeys.onAddLeaf
//   );
//   return proof;
// }

/**
 * @param {string} issuer
 * @param {string} govIdCreds
 */
export async function proofOfResidency(
	sender: string | undefined,
	govIdCreds: {
		creds: { newSecret: string; serializedAsNewPreimage: SerializedCreds };
	},
) {
	console.log("PROOF: us-residency: starting");

	// salt == poseidon("IsFromUS")
	const salt =
		"18450029681611047275023442534946896643130395402313725026917000686233641593164";
	const footprint = await poseidonTwoInputs([
		salt,
		ethers.BigNumber.from(govIdCreds.creds.newSecret).toString(),
	]);

	const [
		issuer,
		newSecret,
		countryCode,
		nameCitySubdivisionZipStreetHash,
		completedAt,
		scope,
	] = govIdCreds.creds.serializedAsNewPreimage;

	const leaf = await createLeaf([
		issuer,
		newSecret,
		countryCode,
		nameCitySubdivisionZipStreetHash,
		completedAt,
		scope,
	]);

	const mp = await getMerkleProofParams(leaf);

	const args = [
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

	await loadArtifacts("proofOfResidency");
	await loadProvingKey("proofOfResidency");

	const { witness } = computeWitness("proofOfResidency", args);
	const proof = generateProof("proofOfResidency", witness);
	console.log("PROOF: us-residency: generated proof", proof);
	return proof;
}

/**
 * @param {string} sender
 * @param {object} govIdCreds
 * @param {string} actionId
 */
export async function antiSybil(
	sender: string | undefined,
	govIdCreds: {
		creds: { newSecret: string; serializedAsNewPreimage: SerializedCreds };
	},
	actionId = defaultActionId,
) {
	console.log("antiSybil called");

	const footprint = await poseidonTwoInputs([
		actionId,
		ethers.BigNumber.from(govIdCreds.creds.newSecret).toString(),
	]);

	const leaf = await createLeaf(govIdCreds.creds.serializedAsNewPreimage);

	const mp = await getMerkleProofParams(leaf);

	const [
		issuer,
		secret,
		countryCode,
		nameCitySubdivisionZipStreetHash,
		completedAt,
		scope,
	] = govIdCreds.creds.serializedAsNewPreimage;

	const args = [
		mp.root,
		ethers.BigNumber.from(sender).toString(),
		ethers.BigNumber.from(issuer).toString(),
		actionId,
		footprint,
		ethers.BigNumber.from(countryCode).toString(),
		ethers.BigNumber.from(nameCitySubdivisionZipStreetHash).toString(),
		ethers.BigNumber.from(completedAt).toString(),
		ethers.BigNumber.from(scope).toString(),
		ethers.BigNumber.from(secret).toString(),
		leaf,
		mp.path,
		mp.indices,
	];

	await loadArtifacts("antiSybil");
	await loadProvingKey("antiSybil");

	const { witness } = computeWitness("antiSybil", args);
	const proof = generateProof("antiSybil", witness);
	console.log("uniqueness proof", proof);
	return proof;
}

/**
 * @param {string} sender
 * @param {object} phoneNumCreds
 * @param {string} actionId
 */
export async function uniquenessPhone(
	sender: string | undefined,
	phoneNumCreds: {
		creds: { newSecret: string; serializedAsNewPreimage: SerializedCreds };
	},
	actionId = defaultActionId,
) {
	console.log("uniquenessPhone called");
	const hashbrowns = await poseidonTwoInputs([
		actionId,
		ethers.BigNumber.from(phoneNumCreds.creds.newSecret).toString(),
	]);

	const leaf = await createLeaf(phoneNumCreds.creds.serializedAsNewPreimage);

	const mp = await getMerkleProofParams(leaf);

	const [
		issuer,
		nullifier,
		phoneNumber,
		// eslint-disable-next-line no-unused-vars
		customField2,
		iat,
		scope,
	] = phoneNumCreds.creds.serializedAsNewPreimage;

	const args = [
		mp.root,
		ethers.BigNumber.from(sender).toString(),
		ethers.BigNumber.from(issuer).toString(),
		actionId,
		hashbrowns,
		ethers.BigNumber.from(phoneNumber).toString(),
		ethers.BigNumber.from(iat).toString(),
		ethers.BigNumber.from(scope).toString(),
		ethers.BigNumber.from(nullifier).toString(),
		leaf,
		mp.path,
		mp.indices,
	];

	await loadArtifacts("sybilPhone");
	await loadProvingKey("sybilPhone");

	const { witness } = computeWitness("sybilPhone", args);

	const proof = generateProof("sybilPhone", witness);
	console.log("uniqueness-phone proof", proof);
	return proof;
}

export async function proofOfMedicalSpecialty(
	sender: string | undefined,
	medicalCreds: {
		creds: {
			newSecret: string;
			serializedAsNewPreimage: SerializedCreds;
		};
	},
) {
	console.log("PROOF: medical-specialty: starting");

	// salt == poseidon("MedicalSpecialty")
	const salt =
		"320192098064396900878317978103229380372186908085604549333845693700248653086";
	const hashbrowns = await poseidonTwoInputs([
		salt,
		ethers.BigNumber.from(medicalCreds.creds.newSecret).toString(),
	]);

	const [issuer, newSecret, specialty, npiNumLicenseMedCredsHash, iat, scope] =
		medicalCreds.creds.serializedAsNewPreimage;

	const leaf = await createLeaf(medicalCreds.creds.serializedAsNewPreimage);

	const mp = await getMerkleProofParams(leaf);

	const args = [
		mp.root,
		ethers.BigNumber.from(sender).toString(),
		ethers.BigNumber.from(issuer).toString(),
		ethers.BigNumber.from(specialty).toString(),
		salt,
		hashbrowns,
		leaf,
		ethers.BigNumber.from(npiNumLicenseMedCredsHash).toString(),
		ethers.BigNumber.from(iat).toString(),
		ethers.BigNumber.from(scope).toString(),
		ethers.BigNumber.from(newSecret).toString(),
		mp.path,
		mp.indices,
	];

	await loadArtifacts("medicalSpecialty");
	await loadProvingKey("medicalSpecialty");

	const { witness, output } = computeWitness("medicalSpecialty", args);

	const proof = generateProof("medicalSpecialty", witness);
	console.log("PROOF: medical-specialty: generated proof", proof);
	return proof;
}

export async function proveKnowledgeOfLeafPreimage(
	serializedCreds: SerializedCreds,
	newSecret: string,
) {
	console.log("proveKnowledgeOfLeafPreimage called");
	const leafArgs = [
		serializedCreds[0], // issuer
		newSecret,
		serializedCreds[2], // countryCode
		serializedCreds[3], // nameDobCitySubdivisionZipStreetExpireHash
		serializedCreds[4], // iat
		serializedCreds[5], // scope
	].map((x) => ethers.BigNumber.from(x).toString());
	const leaf = ethers.BigNumber.from(await createLeaf(leafArgs)).toString();

	const mp = await getMerkleProofParams(leaf);

	await loadArtifacts("knowledgeOfLeafPreimage");
	await loadProvingKey("knowledgeOfLeafPreimage");

	// root, issuerAddr, countryCode, nameDobCitySubdivisionZipStreetExpireHash, iat, scope, secret, field[DEPTH][ARITY] path, private u32[DEPTH] indices
	const proofArgs = [
		mp.root,
		serializedCreds[0], // issuer
		serializedCreds[2], // countryCode
		serializedCreds[3], // nameDobCitySubdivisionZipStreetExpireHash
		serializedCreds[4], // iat
		serializedCreds[5], // scope
		newSecret,
		mp.path,
		mp.indices,
	];

	const { witness, output } = computeWitness(
		"knowledgeOfLeafPreimage",
		proofArgs,
	);
	const proof = generateProof("knowledgeOfLeafPreimage", witness);
	console.log("proveKnowledgeOfLeafPreimage proof", proof);
	return proof;
}

/**
 * @param govIdCreds - object issued from id-server
 */
export async function proveGovIdFirstNameLastName(govIdCreds: $TSFixMe) {
	console.log("proveGovIdFirstNameLastName called");
	const mp = await getMerkleProofParams(govIdCreds.newLeaf);
	const encoder = new TextEncoder();
	const proofArgs = [
		mp.root,
		ethers.BigNumber.from(govIdCreds.creds.issuerAddress).toString(),
		ethers.BigNumber.from(
			encoder.encode(govIdCreds.metadata.rawCreds.firstName),
		).toString(),
		ethers.BigNumber.from(
			encoder.encode(govIdCreds.metadata.rawCreds.lastName),
		).toString(),
		govIdCreds.newLeaf,
		govIdCreds.metadata.rawCreds.middleName
			? ethers.BigNumber.from(
					encoder.encode(govIdCreds.metadata.rawCreds.middleName),
			  ).toString()
			: "0",
		ethers.BigNumber.from(govIdCreds.metadata.rawCreds.countryCode).toString(),
		ethers.BigNumber.from(
			getDateAsInt(govIdCreds.metadata.rawCreds.birthdate),
		).toString(),
		govIdCreds.metadata.derivedCreds.addressHash.value,
		govIdCreds.metadata.rawCreds.expirationDate
			? ethers.BigNumber.from(
					getDateAsInt(govIdCreds.metadata.rawCreds.expirationDate),
			  ).toString()
			: "0",
		ethers.BigNumber.from(govIdCreds.creds.iat).toString(),
		ethers.BigNumber.from(govIdCreds.creds.scope).toString(),
		ethers.BigNumber.from(govIdCreds.creds.newSecret).toString(),
		mp.path,
		mp.indices,
	];

	await loadArtifacts("govIdFirstNameLastName");
	await loadProvingKey("govIdFirstNameLastName");
	const { witness, output } = computeWitness(
		"govIdFirstNameLastName",
		proofArgs,
	);
	const proof = generateProof("govIdFirstNameLastName", witness);
	console.log("proveGovIdFirstNameLastName proof", proof);
	return proof;
}
