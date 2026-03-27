//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef, useCallback } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./MapHooks/useMapInit.js";
import { useMapCamera } from "./MapHooks/useMapCamera.js";
import { useMapHighlight } from "./MapHooks/useMapHighlight.js";
import { useLocationPoints } from "./MapHooks/useLocationPoints.js";
import { useWeatherMarkers } from "./MapHooks/useWeatherMarkers.jsx";
import { useDeviceLocationDot } from "./MapHooks/useDeviceLocationDot.js";
import { useWindLayer } from "./MapHooks/useWindlayer.js";
import { usePrecipitationLayer } from "./MapHooks/usePrecipitationLayer.js";
import { useMapLayerDimming } from "./MapHooks/useMapLayerDimming.js";

import MapLayerToggle from "./MapLayerToggle/MapLayerToggle.jsx";
import WindLegend from "./Windmap/WindLegend.jsx";
import PrecipitationLegend from "./PrecipitationMap/Precipitationlegend.jsx";
import TimeLine from "./Timeline/TimeLine.jsx"
import { LAYER_KEYS } from "./MapLayerToggle/MapToggleConfig.js";

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
		// Precipitation timeline props
		precipTimeline,
		onPrecipTimeUpdate,
		onPrecipPlay,
		onPrecipPause,
	} = props;
	
	const mapContainerRef = useRef(null);

	const map = useMapInit(mapContainerRef, mapStyle, activeLocation);
	useMapCamera(map, mapTarget);
	useMapHighlight(map, highlightGeometry);
	useLocationPoints(map, countryCode, onMapChange);
	useDeviceLocationDot(map, deviceCoords);

	// Vær-overlay: Vind
	const isWindActive = activeLayer === LAYER_KEYS.WIND;
	useWindLayer(map, isWindActive);

	// Vær-overlay: Nedbør
	const isPrecipActive = activeLayer === LAYER_KEYS.PRECIPITATION;
	const precipControls = usePrecipitationLayer(map, isPrecipActive, onPrecipTimeUpdate);

	// Dim kartlag når nedbør er aktivt for bedre kontrast
	useMapLayerDimming(map, isPrecipActive);

	// Kobler play/pause/seek: kaller BÅDE hooken (MapTiler-laget) OG ViewModel (UI-state)
	const handlePrecipPlay = useCallback(() => {
		precipControls.play();
		onPrecipPlay?.();
	}, [precipControls, onPrecipPlay]);

	const handlePrecipPause = useCallback(() => {
		precipControls.pause();
		onPrecipPause?.();
	}, [precipControls, onPrecipPause]);

	const handlePrecipSeek = useCallback((timestampMs) => {
		precipControls.seekTo(timestampMs);
	}, [precipControls]);

	// Markører: vis kun hvis det ikke er aktivt lag, eller bruker har valgt å vise dem
	const shouldShowMarkers = activeLayer === LAYER_KEYS.NONE || showMarkersWithLayer;
	useWeatherMarkers(map, shouldShowMarkers ? weatherPoints : []);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			<WindLegend isVisible={isWindActive} />
			<PrecipitationLegend isVisible={isPrecipActive} />

			<TimeLine
				isVisible={isPrecipActive}
				isPlaying={precipTimeline?.isPlaying ?? false}
				startMs={precipTimeline?.startMs ?? 0}
				endMs={precipTimeline?.endMs ?? 0}
				currentMs={precipTimeline?.currentMs ?? 0}
				timezone={activeLocation?.timezone}
				onPlay={handlePrecipPlay}
				onPause={handlePrecipPause}
				onSeek={handlePrecipSeek}
			/>

			<MapLayerToggle
				activeLayer={activeLayer}
				onLayerChange={onLayerChange}
				showMarkers={showMarkersWithLayer}
				onToggleMarkers={onToggleMarkers}
			/>
		</div>
	);
}