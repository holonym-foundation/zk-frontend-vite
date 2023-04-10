import { zkPhoneEndpoint } from '../constants';
import axios from 'axios';

let hasRequestedCode = false;

export const sendCode = async (phoneNumber: string) => {
  if (!hasRequestedCode) {
    hasRequestedCode = true;
    await axios.get(`${zkPhoneEndpoint}/send/${phoneNumber}`);
  }
};
