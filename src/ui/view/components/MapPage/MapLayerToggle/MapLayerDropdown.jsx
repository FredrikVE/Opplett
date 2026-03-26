//src/ui/view/components/MapPage/MapLayerToggle/MapLayerDropdown.jsx
// MapLayerDropdown.jsx
import MapLayerOption from "./MapLayerOption.jsx";
import MapMarkerToggle from "./MapMarkerToggle.jsx";

export default function MapLayerDropdown(props) {
    const { layers, activeLayer, onSelect, hasActiveOverlay, showMarkers, onToggleMarkers } = props;
    
	return (
		<div className="map-layer-dropdown">
			<div className="map-layer-dropdown-header">Kartlag</div>

			{layers.map(layer => (
				<MapLayerOption
					key={layer.key}
					layer={layer}
					isActive={activeLayer === layer.key}
					onClick={() => onSelect(layer.key)}
				/>
			))}

			{hasActiveOverlay && (
				<>
					<div className="map-layer-divider" />
					<MapMarkerToggle
						showMarkers={showMarkers}
						onClick={onToggleMarkers}
					/>
				</>
			)}
		</div>
	);
}