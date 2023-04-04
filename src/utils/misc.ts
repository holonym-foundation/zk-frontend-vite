import { SiweMessage } from 'siwe';

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export function createSiweMessage(address: $TSFixMe, statement: $TSFixMe, chainId: $TSFixMe) {
  const domain = window.location.host;
  const origin = window.location.origin;
  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId
  });
  return message.prepareMessage();
}

/**
 * @param {string} data 
 * @returns {Promise<string>}
 */
// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export async function sha1String(data: $TSFixMe) {
  const encodedData = new TextEncoder().encode(data);
  return Array.from(new Uint8Array(await window.crypto.subtle.digest('SHA-1', encodedData)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}
