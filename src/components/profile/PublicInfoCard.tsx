import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Oval } from 'react-loader-spinner';
import { InfoButton } from '../info-button';
import ColoredHorizontalRule from '../atoms/ColoredHorizontalRule';
import { useProofMetadata } from '../../context/ProofMetadata';

const ProveButton = ({
  onClick,
  text
}: // @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
$TSFixMe) => (
  <button onClick={onClick} className="profile-prove-button">
    {text}
  </button>
);

const ProofRow = ({
  proofTitle,
  infoText,
  address,
  onClickProve,
  buttonText
}: // @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
$TSFixMe) => (
  <>
    <div className="public-info-proof-name">
      {proofTitle}
      <div style={{ position: 'relative', left: '230px', bottom: '23px' }}>
        <InfoButton type="inPlace" text={infoText} />
      </div>
    </div>
    {address ? (
      <div className="public-info-sbt-owner">{address}</div>
    ) : (
      <ProveButton onClick={onClickProve} text={buttonText} />
    )}
  </>
);

// @ts-expect-error TS(2304): Cannot find name '$TSFixMe'.
function populateProofMetadataDisplayDataAndRestructure(
  proofMetadata: $TSFixMe
) {
  // TODO: Once we submit proofs to multiple chains, we should sort by chain too
  const proofMetadataObj = {};
  for (const metadataItem of proofMetadata) {
    if (metadataItem.proofType === 'uniqueness') {
      metadataItem.displayName = 'Unique Person';
      // metadataItem.fieldValue = `for action ${metadataItem.actionId}`
      metadataItem.fieldValue = 'Yes';
    } else if (metadataItem.proofType === 'us-residency') {
      metadataItem.displayName = 'US Resident';
      metadataItem.fieldValue = 'Yes';
    }
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    proofMetadataObj[metadataItem.proofType] = metadataItem;
  }
  return proofMetadataObj;
}

export default function PublicInfoCard() {
  const navigate = useNavigate();
  // @ts-expect-error TS(2339): Property 'proofMetadata' does not exist on type 'n... Remove this comment to see the full error message
  const { proofMetadata, loadingProofMetadata } = useProofMetadata();
  const [formattedProofMetadata, setFormattedProofMetadata] = useState();

  useEffect(() => {
    const formattedData =
      populateProofMetadataDisplayDataAndRestructure(proofMetadata);
    // @ts-expect-error TS(2345): Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
    setFormattedProofMetadata(formattedData);
  }, [proofMetadata]);

  return (
    <>
      <div className="profile-info-card public-info">
        {loadingProofMetadata && !formattedProofMetadata ? (
          <Oval
            // height={100}
            // width={100}
            color="white"
            wrapperStyle={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
            wrapperClass=""
            visible={true}
            ariaLabel="oval-loading"
            secondaryColor="#060612" // matches card background
            strokeWidth={2}
            strokeWidthSecondary={2}
          />
        ) : (
          <>
            <div className="card-header">
              <h2 className="card-header-title">Soulbound Tokens</h2>
              <p>
                When you generate a proof, you can get a soulbound token that
                records the proven fact.
              </p>
            </div>
            <ColoredHorizontalRule />
            <div className="card-content">
              <div className="public-info-grid">
                <div
                  style={{ fontWeight: 'bold' }}
                  className="public-info-proof-name"
                >
                  Proof Type
                </div>
                <div
                  style={{ fontWeight: 'bold' }}
                  className="public-info-sbt-owner"
                >
                  SBT belongs to
                </div>
                <ProofRow
                  proofTitle="Unique Person (government ID)"
                  infoText={
                    'This shows whether you have publicly claimed a "Unique person (government ID)" SBT at a certain address. You can only prove this at one address from one government ID, allowing for robust Sybil resistance'
                  }
                  // @ts-expect-error TS(2339): Property 'address' does not exist on type 'never'.
                  address={formattedProofMetadata?.uniqueness?.address}
                  onClickProve={() => {
                    navigate('/prove/uniqueness');
                  }}
                  buttonText="Prove uniqueness (government ID)"
                />
                <ProofRow
                  proofTitle="US Resident"
                  infoText={
                    "This shows whether you've publicly claimed a US residency SBT at a certain address"
                  }
                  // @ts-expect-error TS(2339): Property 'address' does not exist on type 'never'.
                  address={formattedProofMetadata?.['us-residency']?.address}
                  onClickProve={() => {
                    navigate('/prove/us-residency');
                  }}
                  buttonText="Prove US residency"
                />
                <ProofRow
                  proofTitle="Unique Person (phone number)"
                  infoText={
                    'This shows whether you have publicly claimed a "Unique person (phone number)" SBT at a certain address. You can only prove this at one address from one phone number, allowing for robust Sybil resistance'
                  }
                  // @ts-expect-error TS(2339): Property 'address' does not exist on type 'never'.
                  address={
                    formattedProofMetadata?.['uniqueness-phone']?.address
                  }
                  onClickProve={() => {
                    navigate('/prove/uniqueness-phone');
                  }}
                  buttonText="Prove uniqueness (phone number)"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
