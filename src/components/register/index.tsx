/**
 * Users can be directed to this page from an external site when the owner
 * of the external site wants the user to verify a certain type of credential
 * and generate a certain proof.
 *
 * This component displays a loading screen while it parses the URL and
 * then redirects the user to the appropriate page (e.g., verify government ID).
 */
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RegisterInner } from './RegisterInner';
import { searchParamsSchema } from './searchParamsSchema';

export const Register = () => {
  const [loadingError, setLoadingError] = useState<string>();
  const [searchParams] = useSearchParams();
  const params = useMemo(() => {
    try {
      return searchParamsSchema.parse({
        credentialType: searchParams.get('credentialType'),
        proofType: searchParams.get('proofType'),
        callback: searchParams.get('callback')
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      setLoadingError(`${error}`);
      return null;
    }
  }, [searchParams]);
  if (params != null) {
    return <RegisterInner params={params} />;
  }
  return loadingError ?? null;
};

export default Register;
