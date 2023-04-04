import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from './components/profile/profile';
import IssuanceOptions from "./components/issuance/IssuanceOptions";
import ProofMenu from "./components/prove/proof-menu";
import OffChainProofs from './components/prove/OffChainProofs';
import GovernmentIDIssuance from "./components/issuance/GovernmentIDIssuance";
import PhoneNumberIssuance from './components/issuance/PhoneNumberIssuance';
import MedicalCredentialsIssuance from './components/issuance/MedicalCredentialsIssuance';
import ExternalIssuance from "./components/issuance/ExternalIssuance";
import { OnChainProofs } from "./App";
import Register from './components/register';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={"/"} element={<IssuanceOptions />} />
      <Route path={"/issuance"} element={<IssuanceOptions />} />
      <Route path={"/issuance/idgov"} element={<GovernmentIDIssuance />} />
      <Route path={"/issuance/idgov/:store"} element={<GovernmentIDIssuance />} />
      <Route path={"/issuance/phone"} element={<PhoneNumberIssuance />} />
      <Route path={"/issuance/phone/:store"} element={<PhoneNumberIssuance />} />
      <Route path={"/issuance/med"} element={<MedicalCredentialsIssuance />} />
      <Route path={"/issuance/med/:store"} element={<MedicalCredentialsIssuance />} />
      <Route path={"/issuance/external/:store"} element={<ExternalIssuance />} />
      <Route path={"/prove"} element={<ProofMenu />} />
      {/* For when there are actionIds and callbacks (right now, this feature is used by the uniqueness proof) */}
      <Route path={"/prove/:proofType/:actionId/:callback"} element={<OnChainProofs />} />
      <Route path={"/prove/:proofType/:actionId"} element={<OnChainProofs />} />
      <Route path={"/prove/:proofType"} element={<OnChainProofs />} />
      <Route path={"/prove/off-chain/:proofType/:actionId/:callback"} element={<OffChainProofs />} />
      <Route path={"/prove/off-chain/:proofType/:actionId"} element={<OffChainProofs />} />
      <Route path={"/prove/off-chain/:proofType"} element={<OffChainProofs />} />
      <Route path={"/profile"} element={<Profile />} />
      {/* <Route path={"/chainswitchertest"} element={<ChainSwitcher />} /> */}
      {/* <Route path={"/chainswitchermodaltest"} element={<ChainSwitcherModal />} /> */}
      <Route path={"/register"} element={<Register />} />
    </Routes>
  );
}
