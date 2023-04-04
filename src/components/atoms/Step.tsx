import { PropsWithChildren } from "react";
import { WithCheckMark } from "./checkmark";

export const Step = ({
	complete,
	current,
	title,
	children,
}: PropsWithChildren<{
	complete: boolean;
	current: boolean;
	title: string;
}>) => {
	const t = <h2>{title}</h2>;
	return (
		<div
			style={{
				marginBottom: complete ? "0px" : "20px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
			}}
		>
			{complete ? (
				<WithCheckMark size={2}>{t}</WithCheckMark>
			) : (
				<>
					{t} {current ? children : null}
				</>
			)}
		</div>
	);
};
