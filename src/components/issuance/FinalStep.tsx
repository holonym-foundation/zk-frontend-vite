/**
 * This component finishes the verification flow for any credential type.
 * It does 2 things (while displaying a loading message):
 * 1. Stores the new credentials.
 * 2. Adds to the Merkle tree a leaf containing the new credentials.
 */

import { ThreeDots } from "react-loader-spinner";
import { Modal } from "../atoms/Modal";
import { useVerificationFlow } from '../../hooks/useVerificationFlow' 

function FinalStep({ onSuccess }: { onSuccess(): void }) {
  const {
    storeCredsQuery,
    confirmationRequired,
    credsThatWillBeOverwritten,
    confirmationDenied,
    onConfirmOverwrite,
    onDenyOverwrite,
    error,
    loadingMessage
  } = useVerificationFlow();

  return (
    <>
      <Modal
        // visible={confirmationModalVisible} 
        visible={confirmationRequired}
        setVisible={() => { }} blur={true} heavyBlur={false} transparentBackground={false} >
        <div style={{ textAlign: 'center' }}>
          <p>You already have credentials from this issuer.</p>
          <p>Would you like to overwrite them?</p>
          <div className="confirmation-modal-buttons" style={{ marginTop: "10px", marginBottom: "10px", marginLeft: "auto", marginRight: "auto" }}>
            <button className="confirmation-modal-button-cancel" onClick={onDenyOverwrite}>No</button>
            <button className="confirmation-modal-button-confirm" onClick={onConfirmOverwrite}>Yes</button>
          </div>
          <p>You will not be able to undo this action.</p>
          <p>You would be overwriting...</p>
        </div>
        {credsThatWillBeOverwritten.map((cred, index) => (
            // rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <p key={index}><code>{cred}</code></p>
          ))}
      </Modal>
      {confirmationDenied ? (
        <>
          <h3>Verification finalization aborted</h3>
          <p>Made a mistake? Please open a ticket in the{" "}
            <a href="https://discord.gg/2CFwcPW3Bh" target="_blank" rel="noreferrer" className="in-text-link">
              #support-tickets
            </a>{" "}
            channel in the Holonym Discord with a description of your situation.
          </p>
        </>
      ) : error ? (
        <>
          <p style={{ color: "#f00", fontSize: "1.1rem" }}>{error}</p>
          {error && (
            <p>Please open a ticket in the{" "}
              <a href="https://discord.gg/2CFwcPW3Bh" target="_blank" rel="noreferrer" className="in-text-link">
                #support-tickets
              </a>{" "}
              channel in the Holonym Discord with a description of the error.
            </p>
          )}
        </>
      ) : (
        <>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <h3 style={{ textAlign: "center", paddingRight: "10px" }}>{loadingMessage}</h3>
            <ThreeDots
              height="20"
              width="40"
              radius="2"
              color="#FFFFFF"
              ariaLabel="three-dots-loading"
              wrapperStyle={{ marginBottom: "-20px" }}
              wrapperClass=""
              visible={true}
            />
          </div>
          {storeCredsQuery.isFetching && (
            <>
              {/* <p>Please sign the new messages in your wallet.</p> */}
              <p>Loading credentials could take a few seconds.</p>
            </>
          )}
        </>
      )}
    </>
  );
};

export default FinalStep;
