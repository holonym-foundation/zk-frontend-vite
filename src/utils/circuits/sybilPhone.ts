import { type Node } from '@zk-kit/incremental-merkle-tree';
import { ethers } from 'ethers';
import { type defaultActionId } from '../../constants';
import { type SerializedCreds } from '../../types';
import { type GetMerkleProofParamsResult } from '../getMerkleProofParams';
import { poseidonTwoInputs } from '../zokrates';

export async function getSybilPhone({
  sender,
  actionId,
  phoneNumCreds,
  mp,
  leaf
}: {
  sender: string;
  phoneNumCreds: {
    creds: { newSecret: string; serializedAsNewPreimage: SerializedCreds };
  };
  actionId: string | typeof defaultActionId;
  mp: GetMerkleProofParamsResult;
  leaf: Node;
}) {
  const [issuer, nullifier, phoneNumber, iat, scope] =
    phoneNumCreds.creds.serializedAsNewPreimage;
  const hashbrowns = await poseidonTwoInputs([
    actionId,
    ethers.BigNumber.from(phoneNumCreds.creds.newSecret).toString()
  ]);
  return [
    mp.root,
    ethers.BigNumber.from(sender).toString(),
    ethers.BigNumber.from(issuer).toString(),
    actionId,
    hashbrowns,
    ethers.BigNumber.from(phoneNumber).toString(),
    ethers.BigNumber.from(iat).toString(),
    ethers.BigNumber.from(scope).toString(),
    ethers.BigNumber.from(nullifier).toString(),
    leaf,
    mp.path,
    mp.indices
  ];
}
