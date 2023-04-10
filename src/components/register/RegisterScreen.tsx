import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchParamsSchema } from './searchParamsSchema';
import { RegisterInner } from './RegisterInner';

export const RegisterScreen = () => {
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
