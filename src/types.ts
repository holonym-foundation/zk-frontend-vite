import { ethers } from "ethers";
import {
	idServerGetCredentialsRespnseSchema,
	issuerAddressSchema,
} from "./id-server";
import { z } from "zod";

// @ts-ignore
// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export type $TSFixMe = any;

export declare type MerkleProof = {
	root: unknown;
	leaf: string;
	siblings: string[][];
	pathIndices: number[];
};

export type Proof = {
	proof: object;
	inputs: string[];
};

export interface ProofMetadata {
	proofType: ProofType;
	address: string;
	chainId: number;
	blockNumber: number;
	txHash: string;
	actionId?: string;
}

export type IdServerGetCredentialsRespnse = z.infer<
	typeof idServerGetCredentialsRespnseSchema
>;

export interface CredentialsSecret {
	newSecret: string;
	newLeafPreimage: string[];
	newLeaf: string;
}

export type RawCredentials = IdServerGetCredentialsRespnse & CredentialsSecret;

export type Creds = IdServerGetCredentialsRespnse["creds"];

export type IssuerAddress = z.infer<typeof issuerAddressSchema>;

export type SerializedCreds = [string, string, string, string, string, string];

export type ProofType =
	| "uniqueness-phone"
	| "uniqueness"
	| "us-residency"
	| "medical-specialty"
	| "gov-id-firstname-lastname"
	| "kolp";

export type Transaction = ethers.Transaction & {
	transactionHash: string;
	blockNumber: number;
	chainId: number;
};

export type DatishStirng = `${number}-${number}-${number}`;