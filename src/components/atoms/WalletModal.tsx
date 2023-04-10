import React from 'react';
import { useConnect, Connector } from 'wagmi';
import { Modal } from './Modal';
import metamaskLogo from '../../img/metamask.svg';
import coinbaseLogo from '../../img/coinbaseWallet.svg';
import walletconnectLogo from '../../img/walletConnect.svg';

const walletMetadata = {
  walletConnect: {
    name: 'Wallet Connect',
    description: 'Other mobile and desktop wallets',
    logo: walletconnectLogo
  },
  metaMask: {
    name: 'MetaMask',
    description: 'The most popular wallet',
    logo: metamaskLogo
  },
  coinbaseWallet: {
    name: 'Coinbase',
    description: 'Coinbase Wallet (mobile or desktop)',
    logo: coinbaseLogo
  },
  injected: {
    name: 'Injected',
    description: 'E.g., Brave Wallet or other browser wallets',
    logo: null
  }
};

const WalletModal = (props: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  blur: boolean;
}) => {
  const { connectors, error, connect } = useConnect();
  return (
    <Modal
      visible={props.visible}
      setVisible={props.setVisible}
      blur={props.blur}
      heavyBlur={true}
      transparentBackground={true}
    >
      {/* <div className="x-card blue"> */}
      <div
        className="x-wrapper small-center"
        style={{ padding: '0px', minWidth: '285px', maxWidth: '400px' }}
      >
        <h2 className="h2-small">Select Wallet</h2>
        <p className="p-2 white">
          Connect to the site below with one of our available wallet providers.
        </p>
        {connectors
          .filter((connector) => connector.id in walletMetadata)
          .sort((a, b) =>
            a.id === 'injected' ? 1 : b.id === 'injected' ? -1 : 0
          )
          .map((connector) => {
            const { description, logo, name } =
              walletMetadata[connector.id as keyof typeof walletMetadata];
            return (
              <div key={connector.id}>
                {/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                  onClick={() => {
                    connect(connector);
                    props.setVisible(false);
                  }}
                >
                  <div className="x-card">
                    {/* rome-ignore lint/a11y/useValidAnchor: <explanation> */}
                    <a style={{ textDecoration: 'none' }}>
                      <div
                        className="id-card profile"
                        style={{ maxWidth: '100%' }}
                      >
                        <div className="id-card-1">
                          {logo && (
                            <img
                              src={logo}
                              loading="lazy"
                              alt=""
                              className="id-img"
                              style={{
                                height: '69px',
                                width: '69px',
                                maxWidth: '200%',
                                marginRight: '30px'
                              }}
                            />
                          )}
                        </div>
                        <div className="id-card-2">
                          <div className="id-profile-name-div">
                            <h3 className="h3 no-margin">{name}</h3>
                          </div>
                          <div className="spacer-xx-small" />
                          <p className="id-designation">{description}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
                <div className="spacer-small" />
              </div>
            );
          })}

        {error != null && <p>{error.message}</p>}
      </div>
    </Modal>
  );
};

export default WalletModal;
