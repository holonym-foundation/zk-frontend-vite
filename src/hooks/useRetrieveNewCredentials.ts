import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "react-query";
import { UserCredentialsSchema } from "../id-server";

function storeSessionId(endpoint: string) {
  const idServerUrl = "your_id_server_url_here";
  if (
    endpoint.includes("veriff-sessionId") &&
    endpoint.includes(`${idServerUrl}/veriff/credentials`)
  ) {
    const sessionId = endpoint.split("sessionId=")[1];
    localStorage.setItem("veriff-sessionId", sessionId);
  }
}

async function fetchNewCredentials(retrievalEndpoint: string) {
  const resp = await fetch(retrievalEndpoint);
  if (resp.status !== 200) {
    throw new Error(await resp.text());
  }
  const data = await resp.json();
  if (!data) {
    throw new Error("Could not retrieve credentials. No credentials found.");
  }
  return data as UserCredentialsSchema;
}

export function useRetrieveNewCredentials({ setError, retrievalEndpoint }: { setError: (error: string) => void; retrievalEndpoint: string }) {
  const newCredsRef = useRef<Awaited<ReturnType<typeof fetchNewCredentials>>>();
  const queryClient = useQueryClient();

  const { data: newCreds } = useQuery(
    ["newCredentials", retrievalEndpoint],
    () => fetchNewCredentials(retrievalEndpoint),
    {
      onError: (error: unknown) => {
        const errorMessage = String((error && typeof error === 'object' && 'message' in error) ? error.message: error);
        setError(errorMessage);
      },
      onSuccess: (newCredsTemp) => {
        newCredsRef.current = newCredsTemp;
        storeSessionId(retrievalEndpoint);
      },
      // The query will not be executed if the retrievalEndpoint is falsy
      enabled: !!retrievalEndpoint,
    }
  );

  useEffect(() => {
    // Invalidate the cache and refetch when the retrievalEndpoint changes
    queryClient.invalidateQueries(["newCredentials", retrievalEndpoint]);
  }, [retrievalEndpoint, queryClient]);

  return {
    newCreds,
  };
}
