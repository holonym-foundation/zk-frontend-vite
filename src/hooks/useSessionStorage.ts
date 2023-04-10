import { useState } from 'react';

export default function useSessionStorage(key: string, initialValue: string) {
  const [item, setInnerValue] = useState(() => {
    try {
      const value = window.sessionStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      } else {
        return initialValue;
      }
    } catch (error) {
      return initialValue;
    }
  });

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
