import { BigNumber, ethers } from "ethers";
import {
	CompilationArtifacts,
	initialize,
	ZoKratesProvider,
} from "zokrates-js";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import {
	preprocEndpoint,
	defaultChainToProveOn,
	defaultActionId,
} from "../constants";
import zokABIs from "../constants/abi/ZokABIs.json";
import assert from "assert";
import Relayer from "./relayer";
// @ts-ignore
import { groth16 } from "snarkjs";
import { MerkleProof } from "../types";

const Preproc = {
	async getProvingKey(circuitName: CircuitName) {
		return await (
			await fetch(`${preprocEndpoint}/${circuitName}.proving.key`)
		).arrayBuffer();
	},
	async getProgram(circuitName: CircuitName) {
		return await (
			await fetch(`${preprocEndpoint}/${circuitName}Program`)
		).arrayBuffer();
	},
	async getVerifyingKey(circuitName: CircuitName) {
		return await (
			await fetch(`${preprocEndpoint}/${circuitName}.verification.key`)
		).arrayBuffer();
	},
};

// TODO: @amosel create a union type for circuitName
type CircuitName = keyof typeof zokABIs;
type Abi = typeof zokABIs[CircuitName];
type Program = Awaited<ReturnType<typeof Preproc["getProgram"]>>;
type VerifyingKey = Awaited<ReturnType<typeof Preproc["getVerifyingKey"]>>;

let zokProvider: ZoKratesProvider | null = null;
let artifacts: Partial<
	Record<
		CircuitName,
		{
			program: Program;
			abi: Abi;
		}
	>
> = {};
let provingKeys: Partial<Record<CircuitName, number[]>> = {};
let verifyingKeys: Partial<Record<CircuitName, VerifyingKey>> = {};

export const computeWitness = (type: CircuitName, args: unknown[]) => {
	if (!zokProvider) {
		throw new Error("zokProvider not initialized");
	}
	const input = artifacts[type];
	if (input === undefined) {
		throw new Error(`Artifacts for ${type} not loaded`);
	}
	return zokProvider?.computeWitness(
		input as unknown as CompilationArtifacts,
		args,
	);
};

export const generateProof = (type: CircuitName, witness: string) => {
	if (!zokProvider) {
		throw new Error("zokProvider not initialized");
	}
	const input = artifacts[type];
	if (input === undefined) {
		throw new Error(`Artifacts for ${type} not loaded`);
	}
	if (input.program === undefined) {
		throw new Error(`Program for ${type} not loaded`);
	}
	let provingKey = provingKeys[type];
	if (provingKey === undefined) {
		throw new Error(`Proving key for ${type} not loaded`);
	}
	return zokProvider.generateProof(
		input.program as Uint8Array,
		witness,
		provingKey as unknown as Uint8Array,
	);
};

export async function loadArtifacts(circuitName: CircuitName) {
	if (circuitName in artifacts) {
		// console.log(`Note: Trying to load ${circuitName} artifacts, which have already been loaded. Not reloading`);
		return;
	}
	artifacts[circuitName] = {
		program: await Preproc.getProgram(circuitName),
		abi: zokABIs[circuitName],
	};
}

export async function loadProvingKey(circuitName: CircuitName) {
	if (circuitName in provingKeys) {
		// console.log(`Note: Trying to load ${circuitName} provingKey, which has already been loaded. Not reloading`);
		return;
	}
	provingKeys[circuitName] = [
		...new Uint8Array(await Preproc.getProvingKey(circuitName)),
	];
}

const sleep = (ms: number = 100) => new Promise((r) => setTimeout(r, ms));

/**
 * @param timeout Time in ms to wait for zokProvider to be initialized
 */
async function waitForZokProvider(timeout = 5000) {
	const start = Date.now();
	while (!zokProvider && Date.now() - start < timeout) {
		await sleep();
	}
}
export async function waitForArtifacts(
	circuitName: CircuitName,
	timeout = 5000,
) {
	const start = Date.now();
	while (!(circuitName in artifacts) && Date.now() - start < timeout) {
		await sleep();
	}
}

/**
 * @param {Array<string>} input length-2 Array of numbers represented as strings.
 * @returns {Promise<string>}
 */
export async function poseidonTwoInputs(args: [string, string]) {
	if (args.length !== 2 || !Array.isArray(args)) {
		throw new Error("input must be an array of length 2");
	}
	if (!zokProvider) {
		// throw new Error("zokProvider has not been initialized");
		await waitForZokProvider(7500);
	}
	if (!("poseidonTwoInputs" in artifacts)) {
		throw new Error("Poseidon hash for two inputs has not been loaded");
	}
	const { output } = computeWitness("poseidonTwoInputs", args);
	return output.replaceAll('"', "");
}

/**
 * @param {Array<string>} input length-5 Array of numbers represented as strings.
 * @returns {string}
 */
export function poseidonHashQuinary(input: string[]) {
	if (input.length !== 5 || !Array.isArray(input)) {
		throw new Error("input must be an array of length 5");
	}
	if (!zokProvider) {
		throw new Error("zokProvider has not been initialized");
	}
	if (!("poseidonQuinary" in artifacts)) {
		throw new Error("Poseidon hash has not been loaded");
	}

	let { output } = computeWitness("poseidonQuinary", input);
	return output.replaceAll('"', "");
}

async function loadArtifacts(circuitName: CircuitName) {
	if (circuitName in artifacts) {
		// console.log(`Note: Trying to load ${circuitName} artifacts, which have already been loaded. Not reloading`);
		return;
	}
	artifacts[circuitName] = {
		program: await Preproc.getProgram(circuitName),
		abi: zokABIs[circuitName],
	};
}

async function loadProvingKey(circuitName: CircuitName) {
	if (circuitName in provingKeys) {
		// console.log(`Note: Trying to load ${circuitName} provingKey, which has already been loaded. Not reloading`);
		return;
	}
	provingKeys[circuitName] = [
		...new Uint8Array(await Preproc.getProvingKey(circuitName)),
	];
}

async function loadVerifyingKey(circuitName: CircuitName) {
	if (circuitName in verifyingKeys) {
		// console.log(`Note: Trying to load ${circuitName} verifyingKey, which has already been loaded. Not reloading`);
		return;
	}
	verifyingKeys[circuitName] = await Preproc.getVerifyingKey(circuitName);
}

loadArtifacts("poseidonQuinary").then(() =>
	console.log("Poseidon hash for five inputs loaded"),
);
loadArtifacts("poseidonTwoInputs").then(() =>
	console.log("Poseidon hash for two inputs loaded"),
);
initialize().then(async (zokratesProvider) => {
	zokProvider = zokratesProvider;
});
