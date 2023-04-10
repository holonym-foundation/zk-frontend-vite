import { ethers } from 'ethers'
import { type DatishStirng, type IdServerGetCredentialsRespnse } from '../../types'
import { type GetMerkleProofParamsResult } from '../getMerkleProofParams'
import assert from 'assert'

/**
 * Convert date string to unix timestamp
 * @param {string} date Must be of form yyyy-mm-dd
 */
export function getDateAsInt (date: DatishStirng) {
  // Format input
  const [year] = date.split('-').map((x) => parseInt(x, 10))
  assert.ok(year >= 1900 && year < 2099) // Make sure date is in a reasonable range, otherwise it's likely the input was malformatted and it's best to be safe by stopping -- we can always allow more edge cases if needed later
  return new Date(date).getTime() / 1000 + 2208988800 // 2208988800000 is 70 year offset; Unix timestamps below 1970 are negative and we want to allow from approximately 1900.
}

export async function getGovIdFirstNameLastName ({
  newLeaf,
  mp,
  creds,
  metadata
}: IdServerGetCredentialsRespnse & {
  newLeaf: string
  creds: { newSecret: string }
  mp: GetMerkleProofParamsResult
}) {
  const encoder = new TextEncoder()
  return [
    mp.root,
    ethers.BigNumber.from(creds.issuerAddress).toString(),
    ethers.BigNumber.from(
      encoder.encode(metadata.rawCreds.firstName)
    ).toString(),
    ethers.BigNumber.from(
      encoder.encode(metadata.rawCreds.lastName)
    ).toString(),
    newLeaf,
    metadata.rawCreds.middleName
      ? ethers.BigNumber.from(
        encoder.encode(metadata.rawCreds.middleName)
			  ).toString()
      : '0',
    ethers.BigNumber.from(metadata.rawCreds.countryCode).toString(),
    ethers.BigNumber.from(
      getDateAsInt(metadata.rawCreds.birthdate as DatishStirng)
    ).toString(),
    metadata.derivedCreds.addressHash.value,
    metadata.rawCreds.expirationDate
      ? ethers.BigNumber.from(
        getDateAsInt(metadata.rawCreds.expirationDate as DatishStirng)
			  ).toString()
      : '0',
    ethers.BigNumber.from(creds.iat).toString(),
    ethers.BigNumber.from(creds.scope).toString(),
    ethers.BigNumber.from(creds.newSecret).toString(),
    mp.path,
    mp.indices
  ]
}
