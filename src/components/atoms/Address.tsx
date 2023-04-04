import { truncateAddress } from "../../utils/ui-helpers";
import userIcon from "../../img/User.svg";
import { useAccount } from "wagmi";

const Address = ({
	address,
	refetch,
}: { address: string; refetch: () => void }) => {
	return (
		<div className="nav-btn" style={{ maxHeight: "64px" }}>
			{/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div onClick={() => refetch()} className="wallet-connected">
				<img src={userIcon} loading="lazy" alt="" className="wallet-icon" />
				<div className="wallet-text">{truncateAddress(address)}</div>
			</div>
		</div>
	);
};

export default Address;
