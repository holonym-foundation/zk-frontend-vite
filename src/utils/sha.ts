/**
 * @param {string} data
 * @returns {Promise<string>}
 */
export async function sha1String (data: string | undefined) {
  const encodedData = new TextEncoder().encode(data)
  return Array.from(
    new Uint8Array(await window.crypto.subtle.digest('SHA-1', encodedData))
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
