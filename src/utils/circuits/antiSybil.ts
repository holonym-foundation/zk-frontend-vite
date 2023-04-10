import { type Node } from '@zk-kit/incremental-merkle-tree';
import { ethers } from 'ethers';
import { type defaultActionId } from '../../constants';
import { type CredsForProof } from '../../types';
import { type GetMerkleProofParamsResult } from '../getMerkleProofParams';
import { poseidonTwoInputs } from '../zokrates';

export async function getAntiSybil({
  sender,
  actionId,
  govIdCreds,
  mp,
  leaf
}: {
  sender: string;
  govIdCreds: {
    creds: CredsForProof;
  };
  actionId: string | typeof defaultActionId;
  mp: GetMerkleProofParamsResult;
  leaf: Node;
}) {
  const footprint = await poseidonTwoInputs([
    actionId,
    ethers.BigNumber.from(govIdCreds.creds.newSecret).toString()
  ]);
  const [
    issuer,
    secret,
    countryCode,
    nameCitySubdivisionZipStreetHash,
    completedAt,
    scope
  ] = govIdCreds.creds.serializedAsNewPreimage;

  return [
    mp.root,
    ethers.BigNumber.from(sender).toString(),
    ethers.BigNumber.from(issuer).toString(),
    actionId,
    footprint,
    ethers.BigNumber.from(countryCode).toString(),
    ethers.BigNumber.from(nameCitySubdivisionZipStreetHash).toString(),
    ethers.BigNumber.from(completedAt).toString(),
    ethers.BigNumber.from(scope).toString(),
    ethers.BigNumber.from(secret).toString(),
    leaf,
    mp.path,
    mp.indices
  ];
}
