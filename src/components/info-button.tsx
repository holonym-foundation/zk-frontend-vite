import { useState, useEffect, useRef } from "react";
import arrow from "../img/Card-Arrow.svg";

const InfoText = ({
	type,
	display,
	clickX,
	clickY,
	text,
}: {
	type: "proofMenu" | "inPlace" | string;
	display: boolean;
	clickX: number;
	clickY: number;
	text: string;
}) => {
	switch (type) {
		case "inPlace":
			return (
				<>
					<div
						className="card-popup-inplace"
						style={{
							display: display ? "block" : "none",
							left: `${clickX + 30}px`,
							top: `${clickY - 10}px`,
						}}
					>
						<p className="card-popup-text">{text}</p>
						<img
							src={arrow}
							style={{
								position: "fixed",
								left: `${clickX + 20}px`,
								top: `${clickY}px`,
							}}
							loading="lazy"
							alt=""
							className="popup-arrow"
						/>
					</div>
				</>
			);
		default:
			return (
				<>
					<div
						className="card-popup"
						style={{ display: display ? "block" : "none" }}
					>
						<p className="card-popup-text">{text}</p>
						<img src={arrow} loading="lazy" alt="" className="popup-arrow" />
					</div>
				</>
			);
	}
};

export const InfoButton = ({
	text,
	type,
}: { text: string; type: "proofMenu" | "inPlace" | string }) => {
	// stop display when clicked outside
	const ref = useRef<HTMLInputElement>(null);
	const [display, setDisplay] = useState(false);
	const [clickX, setClickX] = useState(0);
	const [clickY, setClickY] = useState(0);

	useEffect(() => {
		function handleClick(event: $TSFixMe) {
			if (ref.current && !ref.current.contains(event.target)) {
				setDisplay(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [ref]);

	return (
		<div ref={ref}>
			<button
				className="info-btn w-inline-block"
				style={{ backgroundColor: "transparent" }}
				onClick={(event) => {
					setDisplay(!display);
					console.log("event", event);
					setClickX(event.clientX);
					setClickY(event.clientY);
				}}
			>
				<div className="info-img w-embed">
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M9.375 9.375H10V13.75H10.625"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M10.2812 6.5625C10.2812 6.80412 10.0854 7 9.84375 7C9.60213 7 9.40625 6.80412 9.40625 6.5625C9.40625 6.32088 9.60213 6.125 9.84375 6.125C10.0854 6.125 10.2812 6.32088 10.2812 6.5625Z"
							fill="currentColor"
							stroke="currentColor"
						/>
					</svg>
				</div>
			</button>

			<InfoText
				display={display}
				text={text}
				type={type}
				clickX={clickX}
				clickY={clickY}
			/>
		</div>
	);
};
