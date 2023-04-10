import React, { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HoloAuthSigProvider } from './context/HoloAuthSig';
import { HoloKeyGenSigProvider } from './context/HoloKeyGenSig';
import { ProofMetadataProvider } from './context/ProofMetadata';
import { CredsProvider } from './context/Creds';
import { Provider as WagmiProvider } from 'wagmi';
import { wagmiClient } from './wagmiClient';
import AccountConnectGate from './gate/AccountConnectGate';
import SignatureGate from './gate/SignatureGate';

export const queryClient = new QueryClient();

const connectWalletGateFn = (data: {
  account: { address: string; connector: unknown };
}) => {
  return !!data?.account?.address && !!data?.account?.connector;
};

const signMessagesGateFn = (data: {
  holoAuthSig: string;
  holoAuthSigDigest: string;
  holoKeyGenSig: string;
  holoKeyGenSigDigest: string;
}) => {
  return (
    !!data?.holoAuthSig &&
    !!data?.holoAuthSigDigest &&
    !!data?.holoKeyGenSig &&
    !!data?.holoKeyGenSigDigest
  );
};

export function RootProvider({
  children,
  connectWalletFallback,
  signMessagesFallback
}: PropsWithChildren<{
  connectWalletFallback: React.ReactNode;
  signMessagesFallback: React.ReactNode;
}>) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider client={wagmiClient}>
        <HoloAuthSigProvider>
          <HoloKeyGenSigProvider>
            <AccountConnectGate
              gate={connectWalletGateFn}
              fallback={connectWalletFallback}
            >
              <SignatureGate
                gate={signMessagesGateFn}
                fallback={signMessagesFallback}
              >
                <CredsProvider>
                  <ProofMetadataProvider>{children}</ProofMetadataProvider>
                </CredsProvider>
              </SignatureGate>
            </AccountConnectGate>
          </HoloKeyGenSigProvider>
        </HoloAuthSigProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
