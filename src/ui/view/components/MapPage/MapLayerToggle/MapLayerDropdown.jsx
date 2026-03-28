// src/ui/view/components/MapPage/MapLayerToggle/MapLayerDropdown.jsx
import { useCallback } from "react";
import MapLayerOption from "./MapLayerOption.jsx";

export default function MapLayerDropdown({ layers, activeLayer, onSelect }) {

	const handleSelect = useCallback((key) => {
		onSelect(key);
	}, [onSelect]);

	return (
		<div className="map-layer-dropdown">
			<div className="map-layer-dropdown-header">Kartlag</div>

			<div className="map-layer-dropdown-list">
				{layers.map(layer => (
					<MapLayerOption
						key={layer.key}
						layer={layer}
						isActive={activeLayer === layer.key}
						onSelect={handleSelect}
					/>
				))}
			</div>
		</div>
	);
}