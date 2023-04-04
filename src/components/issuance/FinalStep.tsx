import { ThreeDots } from "react-loader-spinner";
import { Modal } from "../atoms/Modal";

const FinalStep = ({
	onSuccess,
	loadingMessage,
	onDenyOverwrite,
	onConfirmOverwrite,
	credsThatWillBeOverwritten,
	declinedToStoreCreds,
	error,
	storeCredsStatus,
}: {
	onSuccess: () => void;
	loadingMessage: string;
	onDenyOverwrite: () => void;
	onConfirmOverwrite: () => void;
	credsThatWillBeOverwritten?: {
		metadata: {
			rawCreds: unknown;
		};
	};
	declinedToStoreCreds?: boolean;
	error?: string;
	storeCredsStatus?: "loading" | "success" | "error";
}) => {
	return (
		<>
			<Modal
				visible={false}
				setVisible={() => {}}
				blur={true}
				heavyBlur={false}
				transparentBackground={false}
			>
				<div style={{ textAlign: "center" }}>
					<p>You already have credentials from this issuer.</p>
					<p>Would you like to overwrite them?</p>
					<div
						className="confirmation-modal-buttons"
						style={{
							marginTop: "10px",
							marginBottom: "10px",
							marginLeft: "auto",
							marginRight: "auto",
						}}
					>
						<button
							className="confirmation-modal-button-cancel"
							onClick={onDenyOverwrite}
						>
							No
						</button>
						<button
							className="confirmation-modal-button-confirm"
							onClick={onConfirmOverwrite}
						>
							Yes
						</button>
					</div>
					<p>You will not be able to undo this action.</p>
					<p>You would be overwriting...</p>
				</div>
				// @ts-expect-error TS(2339): Property 'metadata' does not exist on type
				'never'... Remove this comment to see the full error message
				{JSON.stringify(
					credsThatWillBeOverwritten?.metadata?.rawCreds ??
						credsThatWillBeOverwritten,
					null,
					2,
				)
					?.replaceAll("}", "")
					?.replaceAll("{", "")
					?.replaceAll('"', "")
					?.split(",")
					?.map((cred, index) => (
						<p key={`${index}`}>
							<code>{cred}</code>
						</p>
					))}
			</Modal>
			{declinedToStoreCreds ? (
				<>
					<h3>Verification finalization aborted</h3>
					<p>
						Made a mistake? Please open a ticket in the{" "}
						<a
							href="https://discord.gg/2CFwcPW3Bh"
							target="_blank"
							rel="noreferrer"
							className="in-text-link"
						>
							#support-tickets
						</a>{" "}
						channel in the Holonym Discord with a description of your situation.
					</p>
				</>
			) : error ? (
				<>
					<p style={{ color: "#f00", fontSize: "1.1rem" }}>{error}</p>
					{error && (
						<p>
							Please open a ticket in the{" "}
							<a
								href="https://discord.gg/2CFwcPW3Bh"
								target="_blank"
								rel="noreferrer"
								className="in-text-link"
							>
								#support-tickets
							</a>{" "}
							channel in the Holonym Discord with a description of the error.
						</p>
					)}
				</>
			) : (
				<>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<h3 style={{ textAlign: "center", paddingRight: "10px" }}>
							{loadingMessage}
						</h3>
						<ThreeDots
							height="20"
							width="40"
							radius="2"
							color="#FFFFFF"
							ariaLabel="three-dots-loading"
							wrapperStyle={{ marginBottom: "-20px" }}
							// @ts-expect-error TS(2322): Type '{ height: string; width: string; radius: str... Remove this comment to see the full error message
							wrapperClassName=""
							visible={true}
						/>
					</div>
					{storeCredsStatus === "loading" && (
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
