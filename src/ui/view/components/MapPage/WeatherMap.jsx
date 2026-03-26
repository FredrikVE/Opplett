//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./hooks/useMapInit.js";
import { useMapCamera } from "./hooks/useMapCamera.js";
import { useMapHighlight } from "./hooks/useMapHighlight.js";
import { useLocationPoints } from "./hooks/useLocationPoints.js";
import { useWeatherMarkers } from "./hooks/useWeatherMarkers.jsx";
import { useDeviceLocationDot } from "./hooks/useDeviceLocationDot.js";
import { useWindLayer } from "./hooks/useWindlayer.js";

import MapLayerToggle from "./MapLayerToggle.jsx";
import WindLegend from "./WindLegend.jsx";

import { LAYER_KEYS } from "../../../utils/MapUtils/MapModeLayers/Weatherlayerconfig.js";

export default function WeatherMap(props) {
	const {
		mapStyle,
		mapTarget,
		weatherPoints,
		onMapChange,
		activeLocation,
		deviceCoords,
		highlightGeometry,
		countryCode,
		activeLayer,
		onLayerChange,
		showMarkersWithLayer,
		onToggleMarkers,
	} = props;
	
	const mapContainerRef = useRef(null);

	const map = useMapInit(mapContainerRef, mapStyle, activeLocation);
	useMapCamera(map, mapTarget);
	useMapHighlight(map, highlightGeometry);
	useLocationPoints(map, countryCode, onMapChange);
	useDeviceLocationDot(map, deviceCoords);

	// Vær-overlay
	const isWindActive = activeLayer === LAYER_KEYS.WIND;
	useWindLayer(map, isWindActive);

	// Markører: vis kun hvis det ikke er aktivt lag, eller bruker har valgt å vise dem
	const shouldShowMarkers = activeLayer === LAYER_KEYS.NONE || showMarkersWithLayer;
	useWeatherMarkers(map, shouldShowMarkers ? weatherPoints : []);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			<WindLegend isVisible={isWindActive} />

			<MapLayerToggle
				activeLayer={activeLayer}
				onLayerChange={onLayerChange}
				showMarkers={showMarkersWithLayer}
				onToggleMarkers={onToggleMarkers}
			/>
		</div>
	);
}