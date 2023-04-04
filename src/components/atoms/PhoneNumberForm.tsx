import { E164Number } from "libphonenumber-js/types";
import { useState } from "react";
import PhoneInput from "react-phone-number-input";

const PhoneNumberForm = ({
	onSubmit,
}: {
	onSubmit: (phone: string) => void;
}) => {
	const [phone, setPhone] = useState<string | undefined>();

	return (
		<>
			<h2 style={{ marginBottom: "25px", marginTop: "-25px" }}>
				Verify your real number
			</h2>
			<p style={{ marginBottom: "25px" }}>
				Please enter your personal phone (burner won't work)
			</p>
			<PhoneInput
				placeholder="Enter phone number"
				defaultCountry="US"
				value={phone}
				onChange={(s) => setPhone(s)}
			/>
			<div className="spacer-medium" />
			<button
				className="x-button secondary outline"
				onClick={phone ? () => onSubmit(phone) : undefined}
			>
				next
			</button>
		</>
	);
};

export default PhoneNumberForm;
