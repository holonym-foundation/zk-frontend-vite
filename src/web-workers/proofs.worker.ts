/**
 * This web worker allows us to load the proofs in the background
 * without blocking the main thread. Loading proofs in the background
 * allows us to load proofs before the user navigates to the proof
 * page, which in turn decreases the time the user spends waiting for
 * a proof to load.
 */
import {
  proofOfResidency,
  antiSybil,
  sybilPhone,
  proofOfMedicalSpecialty,
  proveGovIdFirstNameLastName,
  proveKnowledgeOfLeafPreimage
} from '../utils/proofs';
import { load } from '../utils/zokrates';

const generatingProof = {
  uniqueness: false,
  'us-residency': false,
  'medical-specialty': false,
  'gov-id-firstname-lastname': false,
  kolp: false, // == "Knowlege of Leaf Preimage",
  'uniqueness-phone': false
};

async function loadProof(
  proofFunction: (...args: any[]) => Promise<object>,
  args: unknown[],
  proofType: keyof typeof generatingProof,
  forceReload: boolean
) {
  if (generatingProof[proofType] && !forceReload) return;
  try {
    generatingProof[proofType] = true;
    console.log(
      `[Worker] Generating ${proofType} proof. Received params:`,
      args
    );
    const antiSybilProof = await proofFunction(...args);
    postMessage({ error: null, proofType, proof: antiSybilProof });
  } catch (err) {
    console.log(`[Worker] Error generating ${proofType} proof`, err);
    postMessage({ error: err, proofType, proof: null });
  } finally {
    generatingProof[proofType] = false;
  }
}

onmessage = async (event) => {
  const data = event.data;
  if (!data) return;
  await Promise.all([
    load('artifacts', 'poseidonQuinary'),
    load('artifacts', 'poseidonTwoInputs')
  ]);
  switch (data.message) {
    case 'uniqueness': {
      // prettier-ignore
      await loadProof(antiSybil, [data.userAddress, data.govIdCreds, data.actionId], 'uniqueness', data.forceReload);
      break;
    }
    case 'uniqueness-phone': {
      // prettier-ignore
      await loadProof(sybilPhone, [data.userAddress, data.phoneNumCreds, data.actionId], 'uniqueness-phone', data.forceReload);
      break;
    }
    case 'us-residency': {
      // prettier-ignore
      await loadProof(proofOfResidency, [data.userAddress, data.govIdCreds], 'us-residency', data.forceReload);
      break;
    }
    case 'medical-specialty': {
      // prettier-ignore
      await loadProof(proofOfMedicalSpecialty, [data.userAddress, data.medicalCreds], 'medical-specialty', data.forceReload);
      break;
    }
    case 'gov-id-firstname-lastname': {
      // prettier-ignore
      await loadProof(proveGovIdFirstNameLastName, [data.govIdCreds], 'gov-id-firstname-lastname', data.forceReload);
      break;
    }
    case 'kolp': {
      // prettier-ignore
      await loadProof( proveKnowledgeOfLeafPreimage, [data.serializedAsNewPreimage, data.newSecret], 'kolp', data.forceReload);
      break;
    }
    default: {
      postMessage({ error: 'Unknown message', proofType: null, proof: null });
    }
  }
};
