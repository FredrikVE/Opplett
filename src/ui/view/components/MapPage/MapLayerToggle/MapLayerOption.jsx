// src/ui/view/components/MapPage/MapLayerToggle/MapLayerOption.jsx
import CheckIcon from "../../Common/Icons/CheckIcon.jsx";

export default function MapLayerOption({ layer, isActive, onClick }) {

	const IconComponent = layer.icon;

	return (
		<button
			className={`map-layer-option ${isActive ? "active" : ""}`}
			onClick={onClick}
		>
			<span className="map-layer-option-icon">
				<IconComponent size={layer.iconSize} />
			</span>
			<span className="map-layer-option-label">{layer.label}</span>
			{isActive && (
				<span className="map-layer-option-check">
					<CheckIcon size={14} />
				</span>
			)}
		</button>
	);
}