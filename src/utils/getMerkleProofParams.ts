import { IncrementalMerkleTree, type Node } from '@zk-kit/incremental-merkle-tree'
import { defaultChainToProveOn } from '../constants'
import Relayer from './relayer'
import { type CircuitName, computeWitness, load, poseidonHashQuinary } from './zokrates'
import { type MerkleProof } from '../types'
import { ethers } from 'ethers'

export const restoreTree = async (
  data: Awaited<ReturnType<typeof Relayer['getTree']>>
) => {
  const tree = new IncrementalMerkleTree(poseidonHashQuinary, 14, '0', 5)
  // NOTE: _nodes and _zeroes are private readonly variables in the `incremental-merkle-tree.d` file,
  // but the JavaScript implementation doesn't seem to enforce these constraints.
  // @ts-expect-error TS(2341): Property '_root' is private and only accessible wi... Remove this comment to see the full error message
  tree._root = data._root
  // @ts-expect-error TS(2341): Property '_nodes' is private and only accessible w... Remove this comment to see the full error message
  tree._nodes = data._nodes
  // @ts-expect-error TS(2341): Property '_zeroes' is private and only accessible ... Remove this comment to see the full error message
  tree._zeroes = data._zeroes
  // @ts-expect-error TS(2341): Property '_nodes' is private and only accessible ... Remove this comment to see the full error message
  return { tree, leaves: tree._nodes[0] as Node[] }
}

/**
 * (Forked from holo-merkle-utils)
 * Serializes createProof outputs to ZoKrates format
 */
export function serializeProof (
  proof: MerkleProof,
  hash: (input: string[]) => string
) {
  // Insert the digest of the leaf at every level:
  let digest = proof.leaf
  for (let i = 0; i < proof.siblings.length; i++) {
    proof.siblings[i].splice(proof.pathIndices[i], 0, digest)
    digest = hash(proof.siblings[i])
  }

  // serialize
  const argify = (x: unknown) => ethers.BigNumber.from(x).toString()
  return [
    argify(proof.root),
    argify(proof.leaf),
    proof.siblings.map((x) => x.map(argify)),
    proof.pathIndices.map(argify)
  ]
}

/* Gets Merkle tree and creates Merkle proof */

export async function getMerkleProofParams (leaf: Node) {
  const { tree, leaves } = await Relayer.getTree(defaultChainToProveOn).then(
    restoreTree
  )
  if (!leaves.includes(leaf)) {
    console.error('Could not find leaf in leaves')
    throw new Error('Leaf is not in Merkle tree')
  }

  const index = tree.indexOf(leaf)
  const merkleProof = tree.createProof(index)
  const [root_, leaf_, path_, indices_] = serializeProof(
    merkleProof,
    poseidonHashQuinary
  )

  return {
    root: root_,
    leaf: leaf_,
    path: path_,
    indices: indices_
  }
}

export type GetMerkleProofParamsResult = Awaited<ReturnType<typeof getMerkleProofParams>>

/** Computes a poseidon hash of the input array
 * @param {Array<string>} serializedCreds All other values in the leaf's preimage, as an array of strings
 */

export const loadMerkleProofParams = async (
  serializedCreds: unknown[],
  circuitName: CircuitName
) => {
  Promise.all([
    load('artifacts', 'createLeaf'),
    load('provingKey', 'createLeaf')
  ])
  const leaf = computeWitness(
    'createLeaf',
    serializedCreds
  ).output.replaceAll('"', '')
  const [mp] = await Promise.all([
    getMerkleProofParams(leaf),
    load('artifacts', circuitName),
    load('provingKey', circuitName)
  ])
  return { mp, leaf }
}
