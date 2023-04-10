import { zkPhoneEndpoint } from '../constants'
import axios from 'axios'

let hasRequestedCode = false
const hasRequestedCredentials = false

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export const sendCode = (phoneNumber: $TSFixMe) => {
  if (!hasRequestedCode) axios.get(`${zkPhoneEndpoint}/send/${phoneNumber}`)
  hasRequestedCode = true
}

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export const getCredentialsPhone = (phoneNumber: $TSFixMe, code: $TSFixMe, country: $TSFixMe, callback: $TSFixMe, errCallback: $TSFixMe) => {
  console.log('abcdef')
  axios.get(`${zkPhoneEndpoint}/getCredentials/${phoneNumber}/${code}/${country}`)
    .then((response) => callback(response.data))
    .catch((e) => { console.error(e.response.data); errCallback(e.response.data) })
}
