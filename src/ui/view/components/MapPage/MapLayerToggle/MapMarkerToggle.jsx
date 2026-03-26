//src/ui/view/components/MapPage/MapLayerToggle/MapMarkerToggle.jsx
export default function MapMarkerToggle({ showMarkers, onClick }) {
	return (
		<button className="map-layer-option" onClick={onClick}>
			<span className="map-layer-option-icon">☀️</span>
			<span className="map-layer-option-label">Vis værmarkører</span>
			<span className="map-layer-option-check">
				{showMarkers ? "✓" : ""}
			</span>
		</button>
	);
}