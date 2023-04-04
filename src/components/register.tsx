/**
 * Users can be directed to this page from an external site when the owner
 * of the external site wants the user to verify a certain type of credential
 * and generate a certain proof.
 *
 * This component displays a loading screen while it parses the URL and
 * then redirects the user to the appropriate page (e.g., verify government ID).
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import RoundedWindow from "./RoundedWindow";
import { serverAddress } from "../constants";
import { useCreds } from "../context/Creds";
import { useProofMetadata } from "../context/ProofMetadata";
import { ProofType } from "../types";
import { z } from "zod";

const proofTypeToString = {
	uniqueness: "uniqueness (government ID)",
	"us-residency": "US residency",
	"uniqueness-phone": "uniqueness (phone number)",
};

const InstructionsList = ({
	proofType,
	hasCreds,
	hasProofMetadata,
}: {
	proofType: ProofType;
	hasCreds: boolean;
	hasProofMetadata: boolean;
}) => {
	if (!hasCreds) {
		return (
			<ol>
				<li>
					{proofType === "uniqueness-phone"
						? "Verify your phone number."
						: "Verify your government ID."}
				</li>
				// @ts-expect-error TS(7053): Element implicitly has an 'any' type
				because expre... Remove this comment to see the full error message
				<li>Generate a proof of {proofTypeToString[proofType]}.</li>
			</ol>
		);
	}
	if (hasCreds && !hasProofMetadata) {
		return (
			<ol>
				<li>
					<s>
						{proofType === "uniqueness-phone"
							? "Verify your phone number."
							: "Verify your government ID."}
					</s>
					<span
						style={{ color: "#2fd87a", padding: "10px", fontSize: "1.3rem" }}
					>
						{"\u2713"}
					</span>
				</li>
				<li>
					// @ts-expect-error TS(7053): Element implicitly has an 'any' type
					because expre... Remove this comment to see the full error message
					Generate a proof of {proofTypeToString[proofType]}.
				</li>
			</ol>
		);
	}
	if (hasCreds && hasProofMetadata) {
		return (
			<ol>
				<li>
					<s>
						{proofType === "uniqueness-phone"
							? "Verify your phone number."
							: "Verify your government ID."}
					</s>
					<span
						style={{ color: "#2fd87a", padding: "10px", fontSize: "1.3rem" }}
					>
						{"\u2713"}
					</span>
				</li>
				<li>
					// @ts-expect-error TS(7053): Element implicitly has an 'any' type
					because expre... Remove this comment to see the full error message
					<s>Generate a proof of {proofTypeToString[proofType]}.</s>
					<span
						style={{ color: "#2fd87a", padding: "10px", fontSize: "1.3rem" }}
					>
						{"\u2713"}
					</span>
				</li>
			</ol>
		);
	}
};

const searchParamsSchema = z.object({
	credentialType: z
		.string()
		.refine((value) => ["idgov", "phone"].includes(value)),
	proofType: z
		.string()
		.refine((value) => Object.keys(proofTypeToString).includes(value)),
	callback: z.string().url(),
});

const RegisterScreen = () => {
	const [loadingError, setLoadingError] = useState<string>();
	const [searchParams] = useSearchParams();
	const params = useMemo(() => {
		try {
			return searchParamsSchema.parse({
				credentialType: searchParams.get("credentialType"),
				proofType: searchParams.get("proofType"),
				callback: searchParams.get("callback"),
			});
		} catch (error) {
			setLoadingError(`${error}`);
			return null;
		}
	}, [searchParams]);
};

// setError("Invalid callback URL. Callback is invalid.");

const Register = ({
	params: { callback, credentialType, proofType },
}: { params: z.infer<typeof searchParamsSchema> }) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { proofMetadata, loadingProofMetadata } = useProofMetadata();
	const { sortedCreds, loadingCreds } = useCreds();

	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(true);

	const hostname = useMemo(() => new URL(params.callback).hostname, [callback]);
	const creds = useMemo(() => {
		const server = credentialType === "idgov" ? "idgov-v2" : "phone-v2";
		return sortedCreds?.[serverAddress[server]];
	}, [credentialType, sortedCreds]);

	const hasCreds = useMemo(() => !!creds, [creds]);

	const proofMetadataForSBT = useMemo(
		() =>
			(params &&
				proofMetadata?.filter(
					(metadata) => metadata.proofType === params.proofType,
				)) ||
			null,
		[proofMetadata, params?.proofType],
	);

	const hasProofMetadata = useMemo(
		() => proofMetadataForSBT?.length > 0,
		[proofMetadataForSBT],
	);

	async function handleClick() {
		// Check whether the user has creds of credentialType and whether they have a proof of proofType
		if (proofMetadataForSBT?.length > 0) {
			// Clear relevant localStorage items.
			window.localStorage.removeItem("register-credentialType");
			window.localStorage.removeItem("register-proofType");
			window.localStorage.removeItem("register-callback");
			// Send user to the callback URL. Include address that owns the proof SBT
			window.location.href = `${callback}?address=${proofMetadataForSBT[0].address}`;
			return;
		} else if (hasCreds) {
			// TODO: Add support for off-chain proofs (see off-chain-proofs component.)
			// Send user to proof generation page. User gets redirected back here after submitting their proof
			navigate(`/prove/${proofType}`);
		} else {
			// Send user to verification page for credentialType
			navigate(`/issuance/${credentialType}`);
		}

		window.localStorage.setItem("register-credentialType", credentialType);
		window.localStorage.setItem("register-proofType", proofType);
		window.localStorage.setItem("register-callback", callback);
	}

	return (
		<>
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
					{error ? (
						<>
							<p style={{ color: "red", fontSize: "1rem" }}>{error}</p>
						</>
					) : loading ? (
						<Oval
							height={100}
							width={100}
							color="white"
							wrapperStyle={{}}
							wrapperClass=""
							visible={true}
							ariaLabel="oval-loading"
							secondaryColor="black"
							strokeWidth={2}
							strokeWidthSecondary={2}
						/>
					) : (
						<>
							<p>
								// @ts-expect-error TS(2538): Type 'null' cannot be used as an
								index type.
								<code>{hostname}</code> has requested a proof of{" "}
								{proofTypeToString[searchParams.get("proofType")]} from you. To
								fulfill this request, you need to
							</p>
							<div
								style={{
									lineHeight: "1.5rem",
									fontFamily: "Montserrat",
									fontSize: "small",
								}}
							>
								<InstructionsList
									proofType={params.proofType}
									hasCreds={hasCreds}
									hasProofMetadata={hasProofMetadata}
								/>
							</div>
							<p>
								You will be guided through the process. Once you have generated
								the proof, you will be sent back to <code>{hostname}</code>.
							</p>
							<p>Click OK to continue.</p>
							<button
								type="button"
								className="x-button primary"
								onClick={handleClick}
							>
								OK
							</button>
						</>
					)}
				</div>
			</RoundedWindow>
		</>
	);
};

export default Register;
