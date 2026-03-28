//src/ui/view/components/Common/Icons/WindIcon.jsx
// Tre buede vindlinjer
const WIND_TOP = "M3 8h4a3 3 0 1 0-3-3";
const WIND_MIDDLE = "M3 12h9a3 3 0 1 0-3-3";
const WIND_BOTTOM = "M3 16h6a3 3 0 1 0-3-3";

export default function WindIcon({ size = 18 }) {

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
			<path d={WIND_TOP} />
			<path d={WIND_MIDDLE} />
			<path d={WIND_BOTTOM} />
		</svg>
	);
}