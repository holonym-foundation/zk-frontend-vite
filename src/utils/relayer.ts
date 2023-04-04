import axios from "axios";
import { relayerUrl } from "../constants";
import { BigNumber } from "ethers";
import { Proof } from "../types";

console.log("relayer url is ", relayerUrl);

type Chain = "optimism";
type SubNetwork = "goerli";
type Network = `${Chain}-${SubNetwork}`;

type RelayerResponse = Record<
	`${Network}`,
	{
		nonce: number;
		gasPrice: BigNumber;
		gasLimit: BigNumber;
		to: string;
		value: BigNumber;
		data: string;
		chainId: number;
		v: number;
		r: string;
		s: string;
		from: string;
		hash: string;
		type?: unknown;
		confirmations: number;
	}
>;

type RelayerNetwork = "optimism-goerli" | "optimism";

export const relayerClient = {
	writeProof: async (
		proof: Proof,
		contractName: string,
		network: RelayerNetwork = "optimism-goerli",
	) =>
		await axios
			.post<RelayerResponse>(
				`${relayerUrl}/writeProof/${contractName}/${network}`,
				{
					writeProofArgs: proof,
				},
			)
			.then((response) => response.data),

	getTree: async (network: RelayerNetwork = "optimism-goerli") =>
		axios.get(`${relayerUrl}/v2/getTree/${network}`),
	addLeaf: async (proof: Proof) =>
		axios.post<RelayerResponse>(`${relayerUrl}/v2/addLeaf`, proof),
};

// const Relayer = {
// 	// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
// 	addLeaf: async function (
// 		args: $TSFixMe,
// 		onSuccess: $TSFixMe,
// 		onError: $TSFixMe,
// 	) {
// 		let res;
// 		let error;
// 		try {
// 			res = await axios.post(`${relayerUrl}/v2/addLeaf`, args);
// 			if (res.status === 200) {
// 				onSuccess(res);
// 			}
// 		} catch (e) {
// 			onError?.(e);
// 			error = e;
// 		}
// 		return res || { error: error };
// 	},

// 	// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
// 	prove: async (
// 		proof: $TSFixMe,
// 		contractName: $TSFixMe,
// 		network: $TSFixMe,
// 		onSuccess: $TSFixMe,
// 		onError: $TSFixMe,
// 	) =>
// 		axios
// 			.post(`${relayerUrl}/writeProof/${contractName}/${network}`, {
// 				writeProofArgs: proof,
// 			})
// 			.then((res) => res.data),

// 	// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
// 	getTree: async function (network: $TSFixMe, onError: $TSFixMe) {
// 		let res;
// 		let error;
// 		try {
// 			const response = await axios.get(`${relayerUrl}/v2/getTree/`);
// 			res = response.data;
// 		} catch (e) {
// 			onError?.(e);
// 			error = e;
// 		}
// 		return res || error;
// 	},
// };

export default relayerClient;
