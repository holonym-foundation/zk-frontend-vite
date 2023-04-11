import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { z } from 'zod';
import { serverAddress, idServerUrl } from './constants';
import { type Proof } from 'zokrates-js';

// @ts-expect-error - zod doesn't support union types
const issuerAddressSchema = z.union(Object.values(serverAddress));

export type IssuerAddress = (typeof serverAddress)[keyof typeof serverAddress];

export interface IdServerError {
  error: string;
}

export const CredsSchema = z.object({
  customFields: z.array(z.string()),
  iat: z.string(),
  issuerAddress: issuerAddressSchema,
  scope: z.string(),
  secret: z.string(),
  serializedAsPreimage: z.array(z.string())
});

const derivedCredsValueSchema = z.object({
  derivationFunction: z.string(),
  inputFields: z.array(z.string()),
  value: z.string()
});

const pointSchema = z.object({
  x: z.string(),
  y: z.string()
});

export const idServerGetCredentialsRespnseSchema = z.object({
  creds: CredsSchema,
  leaf: z.string(),
  metadata: z.object({
    derivedCreds: z.object({
      addressHash: derivedCredsValueSchema,
      nameDobCitySubdivisionZipStreetExpireHash: derivedCredsValueSchema,
      nameHash: derivedCredsValueSchema,
      streetHash: derivedCredsValueSchema
    }),
    fieldsInLeaf: z.array(z.string()),
    rawCreds: z.object({
      birthdate: z.string(),
      city: z.string(),
      completedAt: z.string(),
      countryCode: z.number(),
      expirationDate: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      middleName: z.string(),
      streetName: z.string(),
      streetNumber: z.number(),
      streetUnit: z.string(),
      subdivision: z.string(),
      zipCode: z.number()
    })
  }),
  pubkey: pointSchema,
  signature: z.object({
    R8: pointSchema,
    S: z.string()
  })
});

export type IdServerGetCredentialsRespnse = z.infer<
  typeof idServerGetCredentialsRespnseSchema
>;

export interface UserCredentialsSchema {
  proofDigest: string;
  sigDigest: string;
  // NOTE: encryptedCredentials is stored as base64 string. Use LitJsSdk.base64StringToBlob() to convert back to blob
  encryptedCredentials: string;
  encryptedSymmetricKey: string;
  encryptedCredentialsAES: string;
}
const maybeThrowServerErrorOrReturnData = <T>(response: AxiosResponse<T>) => {
  if (!response.data) {
    throw new Error('No data returned from id server');
  } else if (
    typeof response.data === 'object' &&
    'error' in response.data &&
    response.data.error
  ) {
    throw new Error('Error fetching from id server', response.data.error);
  }
  return response.data;
};

export const postCredentials = async (body: {
  sigDigest: string;
  proof: Proof;
  encryptedCredentialsAES: string;
}) =>
  await axios
    .post<{ error?: string }>(`${idServerUrl}/credentials`, body)
    .then((resp) => {
      if (resp.status !== 200) {
        throw new Error(resp.data.error);
      }
      return resp.data;
    });

export const postProofMetadata = async (body: {
  sigDigest: string;
  encryptedProofMetadataAES: string;
}) =>
  await axios.post(`${idServerUrl}/proof-metadata`, body).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(resp.data.error);
    }
    return resp.data;
  });

export const getUserCredentialsSchema = async (
  authSign: string /** lookup */
) =>
  await axios
    .get<UserCredentialsSchema>(
      `${idServerUrl}/credentials?sigDigest=${authSign}`
    )
    .then(maybeThrowServerErrorOrReturnData);

const UserProofMetadataSchema = z.object({
  sigDigest: z.string(),
  encryptedProofMetadata: z.string(),
  encryptedSymmetricKey: z.string(),
  encryptedProofMetadataAES: z.string()
});

export type UserProofMetadata = z.infer<typeof UserProofMetadataSchema>;

export const getProofMetadataForSignatureDigest = async (sigDigest: string) =>
  await axios
    .get<UserProofMetadata>(
      `${idServerUrl}/proof-metadata?sigDigest=${sigDigest}`
    )
    .then((response) => response.data);

export const getVeriffSession = async () =>
  await axios
    .post(`${idServerUrl}/veriff/session`)
    .then((response) => response.data);

export const getRetrivalEndpointForVeriffSessionId = (
  veriffSessionId: string
) => `${idServerUrl}/veriff/credentials?sessionId=${veriffSessionId}`;
