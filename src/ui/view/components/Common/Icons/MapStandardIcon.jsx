//src/ui/view/components/Common/Icons/MapStandardIcon.jsx

// Kart med fold-linjer
const FOLD_LEFT = "M3 3l6 2v16l-6-2V3z";
const FOLD_MIDDLE = "M9 5l6-2v16l-6 2V5z";
const FOLD_RIGHT = "M15 3l6 2v16l-6-2V3z";

export default function MapStandardIcon({ size = 18 }) {

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
			<path d={FOLD_LEFT} />
			<path d={FOLD_MIDDLE} />
			<path d={FOLD_RIGHT} />
		</svg>
	);
}