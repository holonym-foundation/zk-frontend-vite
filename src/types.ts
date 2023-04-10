import { type ethers } from 'ethers';
import { type IdServerGetCredentialsRespnse } from './id-server';
import { type serverAddress } from './constants';
import { Eq } from 'expect-type';

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
export type CredsWithSecret = Creds & CredentialsSecret;

export interface CredsForProof {
  newSecret: string;
  serializedAsNewPreimage: SerializedCreds;
}

export type IssuerAddress = (typeof serverAddress)[keyof typeof serverAddress];

export type SerializedCreds = [string, string, string, string, string, string];

export type SortedCreds = Partial<{
  [k in IssuerAddress]: RawCredentials & {
    creds: CredsForProof;
  };
}>;

export type GovIdCreds = SortedCreds[(typeof serverAddress)['idgov-v2']];
export type PhoneNumCreds = SortedCreds[(typeof serverAddress)['phone-v2']];
export type MedicalCreds = SortedCreds[(typeof serverAddress)['med']];
export type CredsArray = SortedCreds[keyof SortedCreds];

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
