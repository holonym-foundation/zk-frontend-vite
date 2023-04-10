import React, { useState } from 'react';

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export default function useSessionStorage(
  key: $TSFixMe,
  initialValue: $TSFixMe
) {
  const [item, setInnerValue] = useState(() => {
    try {
      return window.sessionStorage.getItem(key)
        ? // @ts-expect-error TS(2345): Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
          JSON.parse(window.sessionStorage.getItem(key))
        : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  // @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
  const setValue = (value: $TSFixMe) => {
    try {
      setInnerValue(value);
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.log(e);
    }
  };

  return [item, setValue];
}
