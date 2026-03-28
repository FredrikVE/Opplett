//src/ui/view/components/Common/Icons/PrecipitationIcon.jsx

// Sky
const CLOUD = "M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25";

// Regndråper
const DROP_LEFT = "M8 19v2";
const DROP_CENTER = "M12 19v2";
const DROP_RIGHT = "M16 19v2";

export default function PrecipitationIcon({ size = 18 }) {

	const viewBox = "0 0 24 24";
	const strokeWidth = 1.5;

	return (
		<svg
			viewBox={viewBox}
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={CLOUD} />
			<path d={DROP_LEFT} />
			<path d={DROP_CENTER} />
			<path d={DROP_RIGHT} />
		</svg>
	);
}