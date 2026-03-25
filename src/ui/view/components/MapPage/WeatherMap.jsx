//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./hooks/useMapInit.js";
import { useMapCamera } from "./hooks/useMapCamera.js";
import { useMapHighlight } from "./hooks/useMapHighlight.js";
import { useLocationPoints } from "./hooks/useLocationPoints.js";
import { useWeatherMarkers } from "./hooks/useWeatherMarkers.jsx";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry, countryCode }) {
	const mapContainerRef = useRef(null);

	const map = useMapInit(mapContainerRef, apiKey, style, activeLocation);
	useMapCamera(map, mapTarget);
	useMapHighlight(map, highlightGeometry);
	useLocationPoints(map, countryCode, onMapChange);
	useWeatherMarkers(map, weatherPoints);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}