import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export function useVerificationFlow() {
  const storeCredsQuery = useQuery(['storeCreds'], {
    queryFn: async () => {
      return {}
    },
  })
  const confirmationRequired = useMemo(() => true, []);


  return {
    storeCredsQuery,
    confirmationRequired,
    credsThatWillBeOverwritten: [],
    error: true,
    confirmationDenied: true,
    onConfirmOverwrite() {

    },
    onDenyOverwrite() {

    },
    loadingMessage: 'hi',
  }
}