import "./App.css";
import "./normalize.css";
import "./webflow.css";
import "./holo-wtf.webflow.css";
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import WebFont from "webfontloader";
import { isMobile } from "react-device-detect";
import LoadingElement from "./components/loading-element";
import RoundedWindow from "./components/RoundedWindow";
import ConnectWalletScreen from "./components/atoms/connect-wallet-screen";
import { RootProvider } from "./RootProvider";
import { Layout } from "./Layout";
import { AppRoutes } from "./AppRoutes";


const NotDesktop = () => <><h1>Please make sure you're on a desktop or laptop computer.</h1><h5>Mobile and other browsers aren't supported in the beta version</h5></>

export const OnChainProofs = React.lazy(() => import("./components/prove/OnChainProofs"));

const ConnectWalletFallback = () => {
  return (
    <Layout>
      <RoundedWindow>
        <ConnectWalletScreen />
      </RoundedWindow>
    </Layout>
  );
}

const SignMessagesFallback = () => {
  return (
    <Layout>
      <RoundedWindow>
        <div
          style={{
            position: "relative",
            paddingTop: "100px",
            width: "100%",
            height: "90%",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            flexDirection: "column",
          }}
        >
          <h2>Please sign the messages in your wallet.</h2>
        </div>
      </RoundedWindow>
    </Layout>
  );
}

function App() {
  const [read, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      WebFont.load({
        google: {
          families: [
            "Montserrat:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic",
          ],
        },
      }),
      // allOtherPromises().then(() => {
      //   setReady(true);
      // }).catch((e) => {
      //   setReady(true);
      // }),
    ])
  }, []);

  if (isMobile) return <NotDesktop />
  return (
    <Router>
      <RootProvider connectWalletFallback={<ConnectWalletFallback />} signMessagesFallback={<SignMessagesFallback />}>
        <Suspense fallback={<LoadingElement />}>
          <Layout>
            <AppRoutes />
          </Layout>
        </Suspense>
      </RootProvider>
    </Router>
  );
}

export default App;
