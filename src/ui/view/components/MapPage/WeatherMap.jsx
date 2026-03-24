// src/ui/view/components/MapPage/WeatherMap.jsx
//
// Samler alle kart-hooks i riktig rekkefølge.
// Endring: mapTarget sendes ikke lenger til useMapInit (init bruker GPS).

import { useRef } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./hooks/useMapInit.js";
import { useMapCamera } from "./hooks/useMapCamera.js";
import { useMapHighlight } from "./hooks/useMapHighlight.js";
import { useLocationPoints } from "./hooks/useLocationPoints.js";
import { useWeatherMarkers } from "./hooks/useWeatherMarkers.jsx";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {
	const mapContainerRef = useRef(null);

	// Init: bruker kun GPS-posisjon, ikke mapTarget
	const map = useMapInit(mapContainerRef, apiKey, style, activeLocation);

	// Kamera: flyTo ved lokasjonsbytte
	useMapCamera(map, mapTarget);

	// Highlight: kommunegrenser osv.
	useMapHighlight(map, highlightGeometry);

	// Finn synlige byer → rapporter punkter for værhenting
	useLocationPoints(map, activeLocation, onMapChange);

	// Tegn værmarkører
	useWeatherMarkers(map, weatherPoints);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}
