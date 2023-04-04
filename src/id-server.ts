import axios from "axios";
import type { AxiosResponse } from "axios";
import { z } from "zod";
import { idServerUrl } from "./constants";

export interface IdServerError {
  error: string;
}

const derivedCredsValueSchema = z.object({
  derivationFunction: z.string(),
  inputFields: z.array(z.string()),
  value: z.string()
})

const pointSchema = z.object({
  x: z.string(),
  y: z.string()
})

export const idServerGetCredentialsRespnseSchema = z.object({
  creds: z.object({
    customFields: z.array(z.string()),
    iat: z.string(),
    issuerAddress: z.string(),
    scope: z.string(),
    secret: z.string(),
    serializedAsPreimage: z.array(z.string())
  }),
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
})

export type IdServerGetCredentialsRespnse = z.infer<typeof idServerGetCredentialsRespnseSchema>;

export interface UserCredentialsSchema {
  proofDigest: string;
  sigDigest: string;
  // NOTE: encryptedCredentials is stored as base64 string. Use LitJsSdk.base64StringToBlob() to convert back to blob
  encryptedCredentials: string;
  encryptedSymmetricKey: string;
  encryptedCredentialsAES: string;
}
const maybeThrowServerErrorOrReturnData = <T>(response: AxiosResponse<T>) => {
  if (!response.data) throw new Error("No data returned from id server");
  if (
    'error' in (response.data as unknown as { error?: unknown })
  ) {
    throw new Error("Error fetching from id server", (response.data as unknown as { error?: unknown }).error!)
  }
  return response.data;
}

export const getUserCredentialsSchema = async (
  authSign: string /** lookup */,
) =>
  await axios
    .get<UserCredentialsSchema>(
      `${idServerUrl}/credentials?sigDigest=${authSign}`,
    )
    .then(maybeThrowServerErrorOrReturnData)


// export const getCredentials = (
//   payload: DeepLinkPayload,
// ): Promise<IdServerGetCredentialsRespnse> => {
//   const url = getIdServerUrl(idServerUrl, payload);
//   `${host}/register${easyUppercase(payload.provider)}/${
//     payload.provider
//   }Credentials?${key}=${payload[key]}`
//   `${host}/veriff/credentials?sessionId=${payload[key]}`
//   return axios.get<IdServerGetCredentialsRespnse>(url).then((res) => res.data);
// };

const UserProofMetadataSchema = z.object({
  sigDigest: z.string(),
  encryptedProofMetadata: z.string(),
  encryptedSymmetricKey: z.string(),
});

export type UserProofMetadata = z.infer<typeof UserProofMetadataSchema>;

export const getProofMetadata = (sigDigest: string) =>
  axios
    .get<UserProofMetadata>(
      `${idServerUrl}/proof-metadata?sigDigest=${sigDigest}`,
    )
    .then((response) => response.data);

export const postProofMetadata = async (reqBody: UserProofMetadata) => {
  const resp = await axios
    .post(`${idServerUrl}/proof-metadata`, reqBody)
    .then((response) => response.data);
};

export const getVeriffSession = async () => axios.post(`${idServerUrl}/veriff/session`).then((response) => response.data);

export const getRetrivalEndpointForVeriffSessionId = (veriffSessionId: string) => `${idServerUrl}/veriff/credentials?sessionId=${veriffSessionId}`;