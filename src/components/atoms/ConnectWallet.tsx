import Address from './Address';
import WalletModal from './WalletModal';
import { useAccount } from 'wagmi';
import { useState } from 'react';

const ConnectWallet = () => {
  const { data: account, refetch } = useAccount();
  const [walletModalShowing, setWalletModalShowing] = useState(false);
  return (
    <>
      <WalletModal
        visible={walletModalShowing}
        setVisible={setWalletModalShowing}
        blur={true}
      />
      {account?.address && account?.connector != null ? (
        <Address address={account.address} refetch={refetch} />
      ) : (
        <div className="nav-btn">
          {/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div
            className="wallet-connected nav-button"
            // disabled={!connectors[0].ready}
            // key={connectors[0].id}
            onClick={() => {
              setWalletModalShowing(true);
            }}
          >
            <div style={{ opacity: 0.5 }}>Connect Wallet</div>
          </div>
        </div>
      )}
    </>
  );
};
export default ConnectWallet;
