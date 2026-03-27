//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef, useCallback, useEffect } from "react";
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
import useTimelineController from "./MapHooks/useTimelineController.js";

import MapLayerToggle from "./MapLayerToggle/MapLayerToggle.jsx";
import WindLegend from "./Windmap/WindLegend.jsx";
import PrecipitationLegend from "./PrecipitationMap/Precipitationlegend.jsx";
import TimeLine from "./Timeline/TimeLine.jsx";
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
	} = props;

	const mapContainerRef = useRef(null);

	const map = useMapInit(mapContainerRef, mapStyle, activeLocation);
	useMapCamera(map, mapTarget);
	useMapHighlight(map, highlightGeometry);
	useLocationPoints(map, countryCode, onMapChange);
	useDeviceLocationDot(map, deviceCoords);

	//Timeline controller
	const {
		timeline: timelineState,
		onTimeUpdate,
		play,
		pause,
	} = useTimelineController();

	//Vind
	const isWindActive = activeLayer === LAYER_KEYS.WIND;
	useWindLayer(map, isWindActive);

	//Nedbør
	const isPrecipActive = activeLayer === LAYER_KEYS.PRECIPITATION;
	const precipControls = usePrecipitationLayer(map, isPrecipActive, onTimeUpdate);
	useMapLayerDimming(map, isPrecipActive);	//Dim kart ved nedbør

	//Handlefunksjoner for tidslinje
	const handlePlay = useCallback(() => {
		precipControls.play();
		play();
	}, [precipControls, play]);

	const handlePause = useCallback(() => {
		precipControls.pause();
		pause();
	}, [precipControls, pause]);

	const handleSeek = useCallback((timestampMs) => {
		precipControls.seekTo(timestampMs);
	}, [precipControls]);


	const onPrecipLayerDeactivatedResetTimeline = useCallback(() => {
		if (!isPrecipActive) {
			onTimeUpdate({
				type: "removed",
			});
		}
	}, [isPrecipActive, onTimeUpdate]);

	useEffect(onPrecipLayerDeactivatedResetTimeline, [onPrecipLayerDeactivatedResetTimeline]);

	//Værikoner 
	const shouldShowMarkers = activeLayer === LAYER_KEYS.NONE || showMarkersWithLayer;
	useWeatherMarkers(map, shouldShowMarkers ? weatherPoints : []);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			<WindLegend isVisible={isWindActive} />
			<PrecipitationLegend isVisible={isPrecipActive} />

			<TimeLine
				isVisible={isPrecipActive}
				isPlaying={timelineState.isPlaying}
				startMs={timelineState.startMs}
				endMs={timelineState.endMs}
				currentMs={timelineState.currentMs}
				timezone={activeLocation?.timezone}
				onPlay={handlePlay}
				onPause={handlePause}
				onSeek={handleSeek}
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