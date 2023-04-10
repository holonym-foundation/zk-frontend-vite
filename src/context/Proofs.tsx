/**
 * This provider generates proofs and stores them in context and session storage.
 * NOTE: This provider must be a child of the signature providers because this
 * provider relies on the user's signatures.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  PropsWithChildren
} from "react";
import { useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import Relayer from "../utils/relayer";
import { sha1String } from "../utils/sha";
import {
  onAddLeafProof,
  proofOfResidency,
  antiSybil,
  sybilPhone,
  proofOfMedicalSpecialty,
  proveGovIdFirstNameLastName,
  proveKnowledgeOfLeafPreimage,
} from "../utils/proofs";
import { serverAddress, defaultActionId } from "../constants";
import { useProofMetadata } from "./ProofMetadata";
import { useCreds } from "./Creds";
import { useQuery } from "@tanstack/react-query";

type UniquenessProofData = {
  // ... properties of your uniqueness proof data
};
type UniquenessPhoneProofData = {
  // ... properties of your uniqueness phone proof data
};
type USResidencyProofData = {
  // ... properties of your uniqueness phone proof data
};

type MedicalSpecialtyProofData = {}

const Proofs = createContext(null);

// Use worker swc
export const proofsWorker = new Worker(
  new URL("./web-workers/proofs.worker.js", import.meta.url),
);

// Use worker in Webpack 5
// const proofsWorker = window.Worker ? new Worker(new URL('../web-workers/load-proofs.js', import.meta.url)) : null;

// Use worker in Webpack 4
// const proofsWorker = new ProofsWorker();

function ProofsProvider({ children }: PropsWithChildren) {
  const [usResidencyProof, setUSResidencyProof] = useState(null);
  const [loadingUSResidencyProof, setLoadingUSResidencyProof] = useState(false);
  const [medicalSpecialtyProof, setMedicalSpecialtyProof] = useState(null);
  const [loadingMedicalSpecialtyProof, setLoadingMedicalSpecialtyProof] =
    useState(false);
  const [sortedCredsDigest, setSortedCredsDigest] = useState(null);
  // numQueuedStoreCredsInvocations is the number of times storeCreds has been queued for
  // invocation. This allows us to trigger a specific number of calls to storeCreds and
  // ensure that storeCreds is called only when sortedCreds and kolpProof are populated.
  const [numQueuedStoreCredsInvocations, setNumQueuedStoreCredsInvocations] =
    useState(0);
  const { data: account } = useAccount();
  const { proofMetadata, loadingProofMetadata } = useProofMetadata();
  const {
    sortedCreds,
    loadingCreds,
    storeCreds,
    govIdCreds,
    phoneNumCreds,
    medicalCreds,
  } = useCreds();
  const prevSortedCredsRef = useRef(sortedCreds);
  const location = useLocation();

  /**
   * Load anti-sybil proof (based on government ID) into context.
   * @param runInMainThread - Whether to generate the proof in the main thread. Prefer false because
   * running in main thread could result in the page freezing while proof is generating.
   */
  const uniquenessProofQuery = useQuery<UniquenessProofData | undefined, Error>(
    ["uniquenessProof"],
    async () => {
      if (govIdCreds === undefined || !account?.address) return undefined;
      const runInMainThread = false;
      const forceReload = false;

      if (!runInMainThread && proofsWorker) {
        proofsWorker.postMessage({
          message: "uniqueness",
          govIdCreds,
          userAddress: account.address,
          actionId: defaultActionId,
          forceReload,
        });
      } else {
        return await antiSybil(account.address, govIdCreds, defaultActionId);
      }
    },
    { enabled: !!govIdCreds && !!account?.address },
  );
  /**
   * Load anti-sybil proof (based on phone number) into context.
   * @param runInMainThread - Whether to generate the proof in the main thread. Prefer false because
   * running in main thread could result in the page freezing while proof is generating.
   */
  const uniquenessPhoneProofQuery = useQuery<
    UniquenessPhoneProofData | undefined,
    Error
  >(
    ["uniquenessPhoneProof"],
    async () => {
      if (!phoneNumCreds || !account?.address) return undefined;

      const runInMainThread = false;
      const forceReload = false;

      if (!runInMainThread && proofsWorker) {
        proofsWorker.postMessage({
          message: "uniqueness-phone",
          phoneNumCreds,
          userAddress: account.address,
          actionId: defaultActionId,
          forceReload,
        });
      } else {
        try {
          return await sybilPhone(
            account.address,
            phoneNumCreds,
            defaultActionId,
          );
        } catch (err) {
          console.error(err);
        }
      }
    },
    {
      enabled: !!sortedCreds?.[serverAddress["phone-v2"]] && !!account?.address,
    },
  );
  // TODO: Low priority: Maybe: Add onAddLeafProof to this context

  /**
   * @param {boolean} suggestForceReload - If true, proofs will be reloaded even if they are already loaded
   * and even if they are currently being loaded UNLESS sortedCreds is the same as it was the last time
   * this function was called.
   */

  async function loadProofs(suggestForceReload = false) {
    if (loadingProofMetadata || loadingCreds || !sortedCreds) return;
    if (
      location.pathname.includes("issuance") &&
      location.pathname.includes("store")
    ) {
      // Do not load proofs if the user is at the end of the issuance flow. We include this check
      // mainly to prevent a race condition between the calls to addLeaf (the one in this context
      // and the one in the issuance/FinalStep component). This check also prevents the unnecessary
      // loading of proofs that will need to be re-loaded once the user completes the issuance flow.
      // Note that we do not include this check in the individual loadXProof functions because
      // we want the issuance flow to be able to trigger the loading of individual proofs.
      return;
    }
    if (
      sortedCredsDigest &&
      sortedCredsDigest === (await sha1String(JSON.stringify(sortedCreds)))
    ) {
      console.log(
        "Denying a reload of proofs because sortedCredsDigest is the same",
        sortedCredsDigest,
      );
      return;
    }
    // @ts-expect-error TS(2345): Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
    setSortedCredsDigest(await sha1String(JSON.stringify(sortedCreds)));
    console.log("Loading proofs. suggestForceReload:", suggestForceReload);
    // Figure out which proofs the user doesn't already have. Then load them
    // if the user has the credentials to do so.
    const missingProofs = {
      uniqueness: !uniquenessProofQuery.data,
      "unique-phone": !uniquenessPhoneProofQuery.data,
      "us-residency": !usResidencyProof,
      "medical-specialty": !medicalSpecialtyProof,
      "gov-id-firstname-lastname": !govIdFirstNameLastNameProofQuery.data, // Not an SBT. No good way to determine whether user needs it, so always generate
      kolp: !kolpProofQuery.data, // Not an SBT. Always needed
    };
    if (proofMetadata) {
      for (const proofMetadataItem of proofMetadata) {
        if (proofMetadataItem?.proofType === "us-residency") {
          missingProofs["us-residency"] = false;
        } else if (proofMetadataItem?.proofType === "uniqueness") {
          missingProofs["uniqueness"] = false;
        } else if (proofMetadataItem?.proofType === "uniqueness-phone") {
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          missingProofs["uniqueness-phone"] = false;
        } else if (proofMetadataItem?.proofType === "medical-specialty") {
          missingProofs["medical-specialty"] = false;
        }
      }
    }
    console.log("creds", sortedCreds);
    if (!sortedCreds) return;

    // if (suggestForceReload || (missingProofs.kolp && !loadingKOLPProof)) {
    //   setLoadingKOLPProof(true);
    //   loadKOLPProof(false, suggestForceReload);
    // }
    // if (suggestForceReload || (missingProofs.uniqueness && !loadingUniquenessProof)) {
    //   setLoadingUniquenessProof(true);
    //   loadUniquenessProof(false, suggestForceReload);
    // }
    // if (suggestForceReload || (missingProofs['uniqueness-phone'] && !uniquenessPhoneProof.data)) {
    //   setLoadingUniquenessPhoneProof(true);
    //   loadUniquenessPhoneProof(false, suggestForceReload);
    // }
    // if (
    //   suggestForceReload ||
    //   (missingProofs["us-residency"] && !loadingUSResidencyProof)
    // ) {
    //   setLoadingUSResidencyProof(true);
    //   loadUSResidencyProof(false, suggestForceReload);
    // }
    // if (
    //   suggestForceReload ||
    //   (missingProofs["gov-id-firstname-lastname"] &&
    //     !loadingGovIdFirstNameLastNameProof)
    // ) {
    //   setLoadingGovIdFirstNameLastNameProof(true);
    //   loadGovIdFirstNameLastNameProof(false, suggestForceReload);
    // }
    // if (
    //   suggestForceReload ||
    //   (missingProofs["medical-specialty"] && !loadingMedicalSpecialtyProof)
    // ) {
    //   setLoadingMedicalSpecialtyProof(true);
    //   loadMedicalSpecialtyProof(false, suggestForceReload);
    // }
  }

  /**
   * @param creds An object from an issuer (not a sortedCreds object).
   */
  async function addLeaf(creds: Parameters<typeof onAddLeafProof>[0]) {
    const circomProof = await onAddLeafProof(creds);
    await Relayer.addLeaf(circomProof);
    await loadKOLPProof(creds.newSecret, creds.serializedAsNewPreimage);

    await Relayer.addLeaf(circomProof, async () => {
      loadKOLPProof(creds.creds.newSecret, creds.creds.serializedAsNewPreimage);
      if (sortedCreds && kolpProof) storeCreds(sortedCreds, kolpProof);
      else {
        setNumQueuedStoreCredsInvocations(numQueuedStoreCredsInvocations + 1);
      }
    });
  }

  useEffect(() => {
    if (numQueuedStoreCredsInvocations > 0 && sortedCreds && kolpProof) {
      setNumQueuedStoreCredsInvocations(numQueuedStoreCredsInvocations - 1);
      storeCreds(sortedCreds, kolpProof);
    }
  }, [numQueuedStoreCredsInvocations, sortedCreds, kolpProof]);

  /**
   * Load proof of residency proof into context.
   * @param runInMainThread - Whether to generate the proof in the main thread. Prefer false because
   * running in main thread could result in the page freezing while proof is generating.
   */
  const usResidencyProofQuery = useQuery<
    USResidencyProofData | undefined,
    Error
  >(
    ["usResidencyProof"],
    async () => {
      if (!govIdCreds || !account?.address) return undefined;

      const runInMainThread = false;
      const forceReload = false;

      if (!runInMainThread && proofsWorker) {
        proofsWorker.postMessage({
          message: "us-residency",
          userAddress: account.address,
          govIdCreds,
          forceReload,
        });
      } else {
        try {
          return await proofOfResidency(account.address, govIdCreds);
        } catch (err) {
          console.error(err);
        }
      }
    },
    { enabled: !!govIdCreds && !!account?.address },
  );

  /**
   * Load medical specialty proof into context.
   * @param runInMainThread - Whether to generate the proof in the main thread. Prefer false because
   * running in main thread could result in the page freezing while proof is generating.
   */
  const medicalSpecialtyProofQuery = useQuery<
    MedicalSpecialtyProofData | undefined,
    Error
  >(
    ["medicalSpecialtyProof"],
    async () => {
      if (!medicalCreds || !account?.address) return undefined;

      const runInMainThread = false;
      const forceReload = false;

      if (!runInMainThread && proofsWorker) {
        proofsWorker.postMessage({
          message: "medical-specialty",
          userAddress: account.address,
          medicalCreds,
          forceReload,
        });
      } else {
        try {
          return await proofOfMedicalSpecialty(account.address, medicalCreds);
        } catch (err) {
          console.error(err);
        }
      }
    },
    { enabled: !!medicalCreds && !!account?.address },
  );

  const govIdFirstNameLastNameProofQuery = useQuery(
    ["govIdFirstNameLastNameProof"],
    async () => {
      if (!govIdCreds) return undefined;

      const runInMainThread = false;
      const forceReload = false;

      if (!runInMainThread && proofsWorker) {
        proofsWorker.postMessage({
          message: "gov-id-firstname-lastname",
          govIdCreds,
          forceReload,
        });
      } else {
        try {
          // @ts-expect-error TS(2322): Type '{ uniquenessProof: null; loadUniquenessProof... Remove this comment to see the full error message
          return await proveGovIdFirstNameLastName(govIdCreds);
        } catch (err) {
          console.error(err);
        }
      }
    },
    { enabled: !!govIdCreds },
  );

  const kolpProofQuery = useQuery(
    ["kolpProof"],
    async () => {
      if (!govIdCreds && !phoneNumCreds) return undefined;

      const runInMainThread = false;
      const forceReload = false;
      const newSecret = creds.newSecret;
      const serializedAsNewPreimage = creds.serializedAsNewPreimage;

      if (proofsWorker && !runInMainThread) {
        if (newSecret && serializedAsNewPreimage) {
          proofsWorker.postMessage({
            message: "kolp",
            newSecret,
            serializedAsNewPreimage,
            forceReload,
          });
        }
        // We just need one KOLP proof. The proof is only used by storage server to verify that
        // the request is in fact from a Holonym user.
        else if (govIdCreds?.creds?.serializedAsNewPreimage) {
          proofsWorker.postMessage({
            message: "kolp",
            newSecret: govIdCreds.creds.newSecret,
            serializedAsNewPreimage: govIdCreds.creds.serializedAsNewPreimage,
            forceReload,
          });
        } else if (phoneNumCreds?.creds?.serializedAsNewPreimage) {
          proofsWorker.postMessage({
            message: "kolp",
            newSecret: phoneNumCreds.creds.newSecret,
            serializedAsNewPreimage:
              phoneNumCreds.creds.serializedAsNewPreimage,
            forceReload,
          });
        }
      }
      if (runInMainThread) {
        if (govIdCreds?.creds?.serializedAsNewPreimage) {
          return await proveKnowledgeOfLeafPreimage(
            govIdCreds?.creds?.serializedAsNewPreimage,
            govIdCreds?.creds?.newSecret,
          );
        } else if (phoneNumCreds?.creds?.serializedAsNewPreimage) {
          return await proveKnowledgeOfLeafPreimage(
            phoneNumCreds?.creds?.serializedAsNewPreimage,
            phoneNumCreds?.creds?.newSecret,
          );
        }
      }
    },
    { enabled: !!govIdCreds || !!phoneNumCreds },
  );
}

// Helper hook to access the provider values
const useProofs = () => useContext(Proofs);

export { ProofsProvider, useProofs };
