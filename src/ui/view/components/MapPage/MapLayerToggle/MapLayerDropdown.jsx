//src/ui/view/components/MapPage/MapLayerToggle/MapLayerDropdown.jsx
import MapLayerOption from "./MapLayerOption.jsx";
import MapMarkerToggle from "./MapMarkerToggle.jsx";

export default function MapLayerDropdown(props) {
    const { layers, activeLayer, onSelect, hasActiveOverlay, showMarkers, onToggleMarkers } = props;
    
	return (
		<div className="map-layer-dropdown">
			<div className="map-layer-dropdown-header">Kartlag</div>

			<div className="map-layer-dropdown-list">
				
				{layers.map(layer => (
					<MapLayerOption
						key={layer.key}
						layer={layer}
						isActive={activeLayer === layer.key}
						onClick={() => onSelect(layer.key)}
					/>
				))}
			</div>

			{hasActiveOverlay && (
				<div className="map-layer-marker-section">
					<div className="map-layer-divider" />
					<MapMarkerToggle
						showMarkers={showMarkers}
						onClick={onToggleMarkers}
					/>
				</div>
			)}
		</div>
	);
}