import "react-phone-number-input/style.css";
import { PropsWithChildren } from "react";
import RoundedWindow from "../RoundedWindow";
import Progress from "../atoms/progress-bar";

const IssuanceContainer = ({
	steps,
	currentIdx,
	children,
}: PropsWithChildren<{
	steps: string[];
	currentIdx: number;
}>) => {
	return (
		<RoundedWindow>
			<div className="spacer-medium" />
			<Progress steps={steps} currentIdx={currentIdx} />
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
				{children}
			</div>
		</RoundedWindow>
	);
};

export default IssuanceContainer;
