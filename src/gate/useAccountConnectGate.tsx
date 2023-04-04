import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

const pageLoadTimestamp = Date.now();

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
export default function useAccountConnectGate(gate: $TSFixMe) {
	const { data: account } = useAccount();
	const [accountShim, setAccountShim] = useState({ address: true, connector: true });

	useEffect(() => {
		// For 1 second, we present a fake account object to the gate function. We wait 1 second before 
		// setting accountShim to the real account object. This is to prevent a flash of the fallback component.
    // For some reason, if the user's wallet is connected, the account object is populated, becomes unpopulated,
    // and then populated again, resulting in a flash of the fallback component.
		if (pageLoadTimestamp + 1000 < Date.now()) {
// @ts-expect-error TS(2345): Argument of type 'GetAccountResult<BaseProvider> |... Remove this comment to see the full error message
			setAccountShim(account);
		} else {
			setTimeout(() => {
// @ts-expect-error TS(2345): Argument of type 'GetAccountResult<BaseProvider> |... Remove this comment to see the full error message
				setAccountShim(account);
			}, 1000);
		}
	}, []);

  useEffect(() => {
    if (pageLoadTimestamp + 1000 < Date.now()) {
      // if threshold time has been reached, we want the shim to reflect any changes to the real object.
      // @ts-expect-error TS(2345): Argument of type 'GetAccountResult<BaseProvider> |... Remove this comment to see the full error message
      setAccountShim(account);
    } else {
      setAccountShim({ address: true, connector: true })
    }
  }, [account])

	return gate({ account: accountShim });
}
