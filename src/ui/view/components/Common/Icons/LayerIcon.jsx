//src/ui/view/components/MapPage/MapLayerToggle/LayerIcon.jsx
import { LAYER_ICON_PATHS } from "./LayerIconShape";

export default function LayerIcon({ size = 18 }) {

	// Geometri
	const minX = 0;
	const minY = 0;
	const internalViewBoxSize = 24;
	const viewBoxDefinition = `${minX} ${minY} ${internalViewBoxSize} ${internalViewBoxSize}`;

	// Stil
	const strokeWidth = 2;
	const fillMode = "none";

	return (
		<svg
			className="map-layer-button-icon"
			viewBox={viewBoxDefinition}
			width={size}
			height={size}
			fill={fillMode}
			stroke="currentColor"
			strokeWidth={strokeWidth}
		>
			<path d={LAYER_ICON_PATHS.top} />
			<path d={LAYER_ICON_PATHS.middle} />
			<path d={LAYER_ICON_PATHS.bottom} />
		</svg>
	);
}