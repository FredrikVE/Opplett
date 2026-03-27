//src/ui/view/components/MapPage/MapLayerToggle/MapLayerOption.jsx
export default function MapLayerOption({ layer, isActive, onClick }) {
	return (
		<button
			className={`map-layer-option ${isActive ? "active" : ""}`}
			onClick={onClick}
		>
			<span className="map-layer-option-icon">{layer.icon}</span>
			<span className="map-layer-option-label">{layer.label}</span>
				{isActive && (
					<span className="map-layer-option-check">✓</span>
				)}
		</button>
	);
}