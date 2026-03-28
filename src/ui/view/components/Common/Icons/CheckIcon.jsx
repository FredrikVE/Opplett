//src/ui/view/components/Common/Icons/CheckIcon.jsx
const CHECK_PATH = "M5 12l5 5L20 7";

export default function CheckIcon({ size = 16 }) {

	const internalViewBoxSize = 24;
	const viewBoxDefinition = `0 0 ${internalViewBoxSize} ${internalViewBoxSize}`;

	const strokeWidth = 2.5;

	return (
		<svg
			className="check-icon"
			viewBox={viewBoxDefinition}
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={CHECK_PATH} />
		</svg>
	);
}