import { type ethers } from 'ethers';
import {
  type IdServerGetCredentialsRespnse,
  type issuerAddressSchema
} from './id-server';
import { type z } from 'zod';

export type $TSFixMe = any;

export declare interface MerkleProof {
  root: unknown;
  leaf: string;
  siblings: string[][];
  pathIndices: number[];
}

export interface Proof {
  proof: object;
  inputs: string[];
}

export interface ProofMetadata {
  proofType: ProofType;
  address: string;
  chainId: number;
  blockNumber: number;
  txHash: string;
  actionId?: string;
}

export interface CredentialsSecret {
  newSecret: string;
  newLeafPreimage: string[];
  newLeaf: string;
}

export type RawCredentials = IdServerGetCredentialsRespnse & CredentialsSecret;

export type Creds = IdServerGetCredentialsRespnse['creds'];

export type IssuerAddress = z.infer<typeof issuerAddressSchema>;

export type SerializedCreds = [string, string, string, string, string, string];

export type ProofType =
  | 'uniqueness-phone'
  | 'uniqueness'
  | 'us-residency'
  | 'medical-specialty'
  | 'gov-id-firstname-lastname'
  | 'kolp';

export type Transaction = ethers.Transaction & {
  transactionHash: string;
  blockNumber: number;
  chainId: number;
};

export type DatishStirng = `${number}-${number}-${number}`;
