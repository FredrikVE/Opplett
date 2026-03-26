//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./MapHooks/useMapInit.js";
import { useMapCamera } from "./MapHooks/useMapCamera.js";
import { useMapHighlight } from "./MapHooks/useMapHighlight.js";
import { useLocationPoints } from "./MapHooks/useLocationPoints.js";
import { useWeatherMarkers } from "./MapHooks/useWeatherMarkers.jsx";
import { useDeviceLocationDot } from "./MapHooks/useDeviceLocationDot.js";
import { useWindLayer } from "./MapHooks/useWindlayer.js";

import MapLayerToggle from "./MapLayerToggle/MapLayerToggle.jsx";
import WindLegend from "./Windmap/WindLegend.jsx";
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