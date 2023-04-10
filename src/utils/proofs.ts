import { ethers } from 'ethers';
import { defaultActionId } from '../constants';
import { computeWitness, generateProof } from './zokrates';
// @ts-expect-error
import { groth16 } from 'snarkjs';
import {
  type RawCredentials,
  type SerializedCreds,
  type CredsForProof
} from '../types';
import { type IdServerGetCredentialsRespnse } from '../id-server';
import { createProof } from './createProof';
import { getKnowledgeOfLeafPreimage } from './circuits/knowledgeOfLeafPreimage';
import { loadMerkleProofParams } from './getMerkleProofParams';
import { getGovIdFirstNameLastName } from './circuits/govIdFirstNameLastName';

// TODO: document what data parameter is
export async function onAddLeafProof(data: RawCredentials) {
  const params = {
    pubKeyX: data.pubkey.x,
    pubKeyY: data.pubkey.y,
    R8x: data.signature.R8.x,
    R8y: data.signature.R8.y,
    S: data.signature.S,
    signedLeaf: data.leaf,
    newLeaf: data.newLeaf,
    signedLeafSecret: data.creds.secret,
    newLeafSecret: data.newSecret,
    iat: data.creds.iat,
    customFields: data.creds.customFields,
    scope: data.creds.scope
  };
  return groth16.fullProve(
    params,
    'https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/onAddLeaf_js/onAddLeaf.wasm',
    'https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/onAddLeaf_0001.zkey'
  );
}

/**
 * @param {string} issuer
 * @param {string} govIdCreds
 */
export async function proofOfResidency(
  sender: string,
  govIdCreds: {
    creds: CredsForProof;
  }
) {
  console.log('PROOF: us-residency: starting');
  const proof = await createProof(
    'proofOfResidency',
    {
      govIdCreds,
      sender
    },
    govIdCreds.creds.serializedAsNewPreimage as unknown as []
  );
  console.log('PROOF: us-residency: generated proof', proof);
  return proof;
}

/**
 * @param {string} sender
 * @param {object} govIdCreds
 * @param {string} actionId
 */
export async function antiSybil(
  sender: string,
  govIdCreds: {
    creds: CredsForProof;
  },
  actionId = defaultActionId
) {
  const proof = await createProof(
    'antiSybil',
    {
      sender,
      govIdCreds,
      actionId
    },
    govIdCreds.creds.serializedAsNewPreimage as unknown as []
  );
  console.log('uniqueness proof', proof);
  return proof;
}

/**
 * @param {string} sender
 * @param {object} phoneNumCreds
 * @param {string} actionId
 */
export async function sybilPhone(
  sender: string,
  phoneNumCreds: {
    creds: CredsForProof;
  },
  actionId = defaultActionId
) {
  const proof = createProof(
    'sybilPhone',
    {
      sender,
      phoneNumCreds,
      actionId
    },
    phoneNumCreds.creds.serializedAsNewPreimage as unknown as []
  );
  console.log('uniqueness-phone proof', proof);
  return await proof;
}

export async function proofOfMedicalSpecialty(
  sender: string | undefined,
  medicalCreds: {
    creds: CredsForProof;
  }
) {
  console.log('PROOF: medical-specialty: starting');
  const proof = createProof(
    'medicalSpecialty',
    {
      medicalCreds,
      sender
    },
    medicalCreds.creds.serializedAsNewPreimage as unknown as []
  );
  console.log('PROOF: medical-specialty: generated proof', proof);
  return await proof;
}

function mergeNewSecret(serializedCreds: SerializedCreds, newSecret: string) {
  return [
    serializedCreds[0], // issuer
    newSecret,
    serializedCreds[2], // countryCode
    serializedCreds[3], // nameDobCitySubdivisionZipStreetExpireHash
    serializedCreds[4], // iat
    serializedCreds[5] // scope
  ].map((x) => ethers.BigNumber.from(x).toString()) as SerializedCreds;
}

export async function proveKnowledgeOfLeafPreimage(
  serializedCreds: SerializedCreds,
  newSecret: string
) {
  console.log('proveKnowledgeOfLeafPreimage called');
  const proof = await generateProof(
    'knowledgeOfLeafPreimage',
    (
      await computeWitness(
        'knowledgeOfLeafPreimage',
        await getKnowledgeOfLeafPreimage({
          serializedCreds,
          newSecret,
          ...(await loadMerkleProofParams(
            mergeNewSecret(serializedCreds, newSecret),
            'knowledgeOfLeafPreimage'
          ).then(({ leaf, mp }) => ({
            mp,
            leaf: ethers.BigNumber.from(leaf).toString()
          })))
        })
      )
    ).witness
  );
  console.log('proveKnowledgeOfLeafPreimage proof', proof);
  return proof;
}

/**
 * @param govIdCreds - object issued from id-server
 */
export async function proveGovIdFirstNameLastName(
  govIdCreds: RawCredentials & {
    newLeaf: string;
    creds: { newSecret: string };
  }
) {
  console.log('proveGovIdFirstNameLastName called');
  const proof = generateProof(
    'govIdFirstNameLastName',
    (
      await computeWitness(
        'govIdFirstNameLastName',
        await getGovIdFirstNameLastName({
          ...govIdCreds,
          ...(await loadMerkleProofParams(
            [govIdCreds.newLeaf],
            'govIdFirstNameLastName'
          ))
        })
      )
    ).witness
  );
  console.log('proveGovIdFirstNameLastName proof', proof);
  return await proof;
}
