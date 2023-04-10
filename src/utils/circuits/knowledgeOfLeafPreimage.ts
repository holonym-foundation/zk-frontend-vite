import { type Node } from '@zk-kit/incremental-merkle-tree'
import { type SerializedCreds } from '../../types'
import { type GetMerkleProofParamsResult } from '../getMerkleProofParams'

// root, issuerAddr, countryCode, nameDobCitySubdivisionZipStreetExpireHash, iat, scope, secret, field[DEPTH][ARITY] path, private u32[DEPTH] indices
export async function getKnowledgeOfLeafPreimage ({
  serializedCreds,
  newSecret,
  mp
}: {
  serializedCreds: SerializedCreds
  newSecret: string
  mp: GetMerkleProofParamsResult
  leaf: Node
}) {
  return [
    mp.root,
    serializedCreds[0], // issuer
    serializedCreds[2], // countryCode
    serializedCreds[3], // nameDobCitySubdivisionZipStreetExpireHash
    serializedCreds[4], // iat
    serializedCreds[5], // scope
    newSecret,
    mp.path,
    mp.indices
  ]
}
