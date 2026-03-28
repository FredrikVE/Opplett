// src/ui/view/components/MapPage/MapLayerToggle/WeatherMarkerIcon.jsx

// Solikon med stråler — representerer værmarkører på kartet
const SUN_CENTER_X = 12;
const SUN_CENTER_Y = 12;
const SUN_RADIUS = 4;

// Stråler: 8 linjer ut fra sentrum
const RAY_INNER = 6.5;
const RAY_OUTER = 9;

function buildRayPath(angleDeg) {
	const rad = (angleDeg * Math.PI) / 180;
	const x1 = SUN_CENTER_X + RAY_INNER * Math.cos(rad);
	const y1 = SUN_CENTER_Y + RAY_INNER * Math.sin(rad);
	const x2 = SUN_CENTER_X + RAY_OUTER * Math.cos(rad);
	const y2 = SUN_CENTER_Y + RAY_OUTER * Math.sin(rad);
	return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const RAY_PATHS = RAY_ANGLES.map(buildRayPath).join("");

export default function WeatherMarkerIcon({ size = 16 }) {

	const internalViewBoxSize = 24;
	const viewBoxDefinition = `0 0 ${internalViewBoxSize} ${internalViewBoxSize}`;

	const strokeWidth = 2;

	return (
		<svg
			viewBox={viewBoxDefinition}
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx={SUN_CENTER_X} cy={SUN_CENTER_Y} r={SUN_RADIUS} />
			<path d={RAY_PATHS} />
		</svg>
	);
}