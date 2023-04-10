import {
	CompilationArtifacts,
	initialize,
	ZoKratesProvider,
} from "zokrates-js";
import {
	preprocEndpoint,
} from "../constants";
import zokABIs from "../constants/abi/ZokABIs.json";
import { SharedAsyncMemoized } from "./SharedAsyncMemoized";

const Preproc = {
  'artifacts': async (circuitName: CircuitName) => await (
    await fetch(`${preprocEndpoint}/${circuitName}Program`)
  ).arrayBuffer() as Uint8Array,
  'provingKey': async (circuitName: CircuitName) => await (
      await fetch(`${preprocEndpoint}/${circuitName}.proving.key`)
    ).arrayBuffer() as Uint8Array,
  'verifyingKey':async (circuitName:CircuitName) => await (
    await fetch(`${preprocEndpoint}/${circuitName}.verification.key`)
  ).arrayBuffer() as Uint8Array,
} as const;


// TODO: @amosel create a union type for circuitName
export type CircuitName = keyof typeof zokABIs
type Abi = (typeof zokABIs)[CircuitName]
type Program = Awaited<ReturnType<(typeof Preproc)['artifacts']>>
type VerifyingKey = Awaited<ReturnType<(typeof Preproc)['verifyingKey']>>

let zok: ZoKratesProvider | null = null;
let initZok: null| Promise<ZoKratesProvider>;

async function waitForZokProvider(retries = 3, timeout = 1000): Promise<ZoKratesProvider> {
  if (zok) {
    return zok;
  } if (initZok) {
    return initZok;
  } else {
    initZok = new Promise((resolve, reject) => {
      initialize().then(async (zokratesProvider) => {
        zok = zokratesProvider;
        initZok = null;
      })
    });
    return initZok;
  }
}

export async function waitForArtifacts(
	circuitName: CircuitName,
) {
	await load('artifacts', circuitName);
  return;
}
const artifacts: Partial<
	Record<
		CircuitName,
		{
			program: Program;
			abi: Abi;
		}
	>
> = {};

const cache = new SharedAsyncMemoized(async (key: `${CircuitName}.${keyof typeof Preproc}`) => {
  const [circuitName, preprocKey] = key.split(".");
  const result = await Preproc[preprocKey as keyof typeof Preproc](circuitName as CircuitName);
	return result;
});


export async function load(
	type: "artifacts" | "provingKey" | "verifyingKey",
	circuitName: CircuitName,
) {
  return cache.waitForKey(`${circuitName}.${type}`);
}


export const computeWitness = async (circuit: CircuitName, args: unknown[]) => {
  const [zok, input] = await Promise.all([
    waitForZokProvider(),
    load('artifacts', circuit)
  ]);
	return zok.computeWitness(
		input as unknown as CompilationArtifacts,
		args,
	);
};

export const generateProof = async (circuitName: CircuitName, witness: string) => {
	const program = await load('artifacts',circuitName);
	if (program) {
		throw new Error(`Artifacts for ${circuitName} not loaded`);
	}
	const provingKey = await load('provingKey',circuitName); 
	if (!provingKey) {
		throw new Error(`Proving key for ${circuitName} not loaded`);
	}
  return (await waitForZokProvider()).generateProof(
		program,
		witness,
		provingKey as unknown as Uint8Array,
	);
};

/**
 * @param {Array<string>} input length-2 Array of numbers represented as strings.
 * @returns {Promise<string>}
 */
export async function poseidonTwoInputs(args: [string, string]) {
	if (args.length !== 2 || !Array.isArray(args)) {
		throw new Error("input must be an array of length 2");
	}
	const { output } = await computeWitness("poseidonTwoInputs", args);
	return output.replaceAll('"', "");
}

/**
 * @param {Array<string>} input length-5 Array of numbers represented as strings.
 * @returns {string}
 */
export async function poseidonHashQuinary(input: [string, string, string, string, string]) {
	if (input.length !== 5 || !Array.isArray(input)) {
		throw new Error("input must be an array of length 5");
	}
	const { output } = await computeWitness("poseidonQuinary", input);
	return output.replaceAll('"', "");
}

// load("artifacts", "poseidonQuinary").then(() =>
// 	console.log("Poseidon hash for five inputs loaded"),
// );
// load("artifacts", "poseidonTwoInputs").then(() =>
// 	console.log("Poseidon hash for two inputs loaded"),
// );


/** Computes a poseidon hash of the input array
 * @param {Array<string>} serializedCreds All other values in the leaf's preimage, as an array of strings
 */
export async function createLeaf(serializedCreds: string[]) {
  Promise.all([load('artifacts', "createLeaf"), load('provingKey', "createLeaf")]);
  const { output } = await computeWitness('createLeaf', serializedCreds);
  return output.replaceAll('"', "");
}
