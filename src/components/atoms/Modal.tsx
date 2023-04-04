import {
	JSXElementConstructor,
	PropsWithChildren,
	ReactElement,
	ReactFragment,
	ReactPortal,
	useEffect,
	useRef,
} from "react";

export const Modal = ({
	children,
	visible,
	setVisible,
	blur,
	heavyBlur,
	transparentBackground,
}: PropsWithChildren<{
	visible: boolean;
	setVisible: (visible: boolean) => void;
	blur?: boolean;
	heavyBlur?: boolean;
	transparentBackground?: boolean;
}>) => {
	// stop display when clicked outside
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		function handleClick(event: $TSFixMe) {
			if (ref.current && !ref.current.contains(event.target)) {
				setVisible(false);
			}
		}

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [ref]);

	return (
		<div style={{ display: visible ? "block" : "none" }}>
			<div
				className={`bg-img x-section wf-section ${blur ? "blur" : ""}`}
				style={{
					backdropFilter: `blur(${heavyBlur ? "17" : "6"}px)`,
					position: "fixed",
					zIndex: 10000,
					left: "0px",
					top: "0px",
					width: "100vw",
					height: "100vh",
				}}
			>
				<div className="x-container w-container">
					<div
						ref={ref}
						className={`x-card small ${blur ? "large-blur" : ""}`}
						style={{
							backgroundColor: transparentBackground
								? "transparent"
								: "var(--dark-card-background)",
							maxHeight: "75vh",
							overflowY: "auto",
						}}
					>
						<div className="card-heading" style={{ alignItems: "normal" }}>
							<div>{children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const SimpleModal = (
	props: PropsWithChildren<{
		setVisible: (visible: boolean) => void;
		visible: boolean;
		blur?: boolean;
	}>,
) => {
	// stop display when clicked outside
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		function handleClick(event: $TSFixMe) {
			if (ref.current && !ref.current.contains(event.target)) {
				props.setVisible(false);
			}
		}

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [ref]);

	return (
		<div
			className={`x-section bg-img ${props.blur ? "blur" : ""}`}
			style={{
				display: props.visible ? "block" : "none",
				position: "absolute",
				top: "0px",
				left: "0px",
				width: "100vw",
				height: "100vh",
			}}
		>
			<div className="x-container w-container">
				<div
					ref={ref}
					className={`x-card blue-yellow ${props.blur ? "large-blur" : ""}`}
				>
					<div>{props.children}</div>
				</div>
			</div>
		</div>
	);
};
