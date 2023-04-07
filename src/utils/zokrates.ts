import {
	CompilationArtifacts,
	initialize,
	ZoKratesProvider,
} from "zokrates-js";
import {
	preprocEndpoint,
} from "../constants";
import zokABIs from "../constants/abi/ZokABIs.json";

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
export type CircuitName = keyof typeof zokABIs;
type Abi = typeof zokABIs[CircuitName];
type Program = Awaited<ReturnType<typeof Preproc["getProgram"]>>;
type VerifyingKey = Awaited<ReturnType<typeof Preproc["getVerifyingKey"]>>;

let zokProvider: ZoKratesProvider | null = null;
const artifacts: Partial<
	Record<
		CircuitName,
		{
			program: Program;
			abi: Abi;
		}
	>
> = {};
const provingKeys: Partial<Record<CircuitName, Uint8Array>> = {};
const verifyingKeys: Partial<Record<CircuitName, VerifyingKey>> = {};

export const computeWitness = (type: CircuitName, args: unknown[]) => {
	if (!zokProvider) {
		throw new Error("zokProvider not initialized");
	}
	if (!(type in artifacts)) {
		throw new Error(`${type} hash has not been loaded`);
	}
	const input = artifacts[type];
	if (input === undefined) {
		throw new Error(`Artifacts for ${type} not loaded`);
	}
	return zokProvider.computeWitness(
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
	const provingKey = provingKeys[type];
	if (provingKey === undefined) {
		throw new Error(`Proving key for ${type} not loaded`);
	}
	return zokProvider.generateProof(
		input.program as Uint8Array,
		witness,
		provingKey as unknown as Uint8Array,
	);
};


export async function load(
	type: "artifacts" | "provingKey" | "verifyingKey",
	circuitName: CircuitName,
) {
	switch (type) {
		case "artifacts": {
			if (circuitName in artifacts) {
				throw new Error(
					`Note: Trying to load ${circuitName} artifacts, which have already been loaded. Not reloading`,
				);
			}
			artifacts[circuitName] = {
				program: await Preproc.getProgram(circuitName),
				abi: zokABIs[circuitName],
			};
			break;
		}
		case "provingKey": {
			if (circuitName in provingKeys) {
				throw new Error(
					`Note: Trying to load ${circuitName} provingKey, which has already been loaded. Not reloading`,
				);
			}
			provingKeys[circuitName] = new Uint8Array(
				await Preproc.getProvingKey(circuitName),
			);
			break;
		}
		case "verifyingKey": {
			if (circuitName in verifyingKeys) {
				throw new Error(
					`Note: Trying to load ${circuitName} verifyingKey, which has already been loaded. Not reloading`,
				);
			}
			verifyingKeys[circuitName] = await Preproc.getVerifyingKey(circuitName);
			break;
		}
	}
}

const sleep = (ms: number = 100) => new Promise((r) => setTimeout(r, ms));

/**
 * @param timeout Time in ms to wait for zokProvider to be initialized
 */
async function waitForZokProvider(timeout = 1000, retries = 3) {
	if (retries === 0) {
		throw new Error("zokProvider failed initialization");
	}
	const start = Date.now();
	while (!zokProvider && Date.now() - start < timeout) {
		await sleep();
	}
	waitForZokProvider(timeout = 1000, retries--);
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
		await waitForZokProvider();
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

	const { output } = computeWitness("poseidonQuinary", input);
	return output.replaceAll('"', "");
}

load("artifacts", "poseidonQuinary").then(() =>
	console.log("Poseidon hash for five inputs loaded"),
);
load("artifacts", "poseidonTwoInputs").then(() =>
	console.log("Poseidon hash for two inputs loaded"),
);
initialize().then(async (zokratesProvider) => {
	zokProvider = zokratesProvider;
});
