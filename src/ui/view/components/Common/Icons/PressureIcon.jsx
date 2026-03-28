//src/ui/view/components/Common/Icons/PressureIcon.jsx

// Barometer / trykkindikator — sirkel med nål
const OUTER_CIRCLE_X = 12;
const OUTER_CIRCLE_Y = 12;
const OUTER_RADIUS = 9;

// Nål fra sentrum opp-høyre
const NEEDLE = "M12 12l4-6";

// Bunn-streker for skala
const SCALE_LEFT = "M7 18l1-1";
const SCALE_RIGHT = "M17 18l-1-1";
const SCALE_TOP = "M12 5v2";

export default function PressureIcon({ size = 18 }) {

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
			<circle cx={OUTER_CIRCLE_X} cy={OUTER_CIRCLE_Y} r={OUTER_RADIUS} />
			<path d={NEEDLE} />
			<path d={SCALE_LEFT} />
			<path d={SCALE_RIGHT} />
			<path d={SCALE_TOP} />
		</svg>
	);
}