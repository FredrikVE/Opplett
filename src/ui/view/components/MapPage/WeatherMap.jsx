//src/ui/view/components/MapPage/WeatherMap.jsx
import { useState, useRef, useCallback } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./MapHooks/useMapInit.js";
import { useMapCamera } from "./MapHooks/useMapCamera.js";
import { useMapHighlight } from "./MapHooks/useMapHighlight.js";
import { useLocationPoints } from "./MapHooks/useLocationPoints.js";
import { useWeatherMarkers } from "./MapHooks/useWeatherMarkers.jsx";
import { useDeviceLocationDot } from "./MapHooks/useDeviceLocationDot.js";
import { useWeatherLayers } from "./MapHooks/useWeatherLayers.js";
import { useMapLayerDimming } from "./MapHooks/useMapLayerDimming.js";
import { useTimelineController } from "./MapHooks/useTimelineController.js";

import MapCanvasLegend from "./MapCanvasLegend.jsx";

import MapLayerToggle from "./MapLayerToggle/MapLayerToggle.jsx";
import TimeLine from "./Timeline/TimeLine.jsx";
import { LAYER_KEYS } from "./MapLayerToggle/MapToggleConfig.js";

const LAYER_UNITS = {
	[LAYER_KEYS.WIND]: "m/s",
	[LAYER_KEYS.PRECIPITATION]: "mm/t",
	[LAYER_KEYS.PRESSURE]: "hPa",
	[LAYER_KEYS.TEMPERATURE]: "°C",
};

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
	const [isLayerToggleOpen, setIsLayerToggleOpen] = useState(false);

	const map = useMapInit(mapContainerRef, mapStyle, activeLocation);
	useMapCamera(map, mapTarget);
	useMapHighlight(map, highlightGeometry);
	useLocationPoints(map, countryCode, onMapChange);
	useDeviceLocationDot(map, deviceCoords);

	const {
		timeline: timelineState,
		onTimeUpdate,
		play,
		pause,
	} = useTimelineController();

	const layerControls = useWeatherLayers(map, activeLayer, onTimeUpdate);

	const isPrecipActive = activeLayer === LAYER_KEYS.PRECIPITATION;
	useMapLayerDimming(map, isPrecipActive);

	const hasActiveOverlayLayer = activeLayer && activeLayer !== LAYER_KEYS.NONE;

	const handlePlay = useCallback(() => {
		layerControls.play();
		play();
	}, [layerControls, play]);

	const handlePause = useCallback(() => {
		layerControls.pause();
		pause();
	}, [layerControls, pause]);

	const handleSeek = useCallback((timestampMs) => {
		const clampedMs = Math.max(timestampMs, timelineState.startMs);
		layerControls.seekTo(clampedMs);
	}, [layerControls, timelineState.startMs]);

	const shouldShowMarkers = activeLayer === LAYER_KEYS.NONE || showMarkersWithLayer;
	useWeatherMarkers(map, shouldShowMarkers ? weatherPoints : []);

	const showTimeline = hasActiveOverlayLayer && !isLayerToggleOpen;

	const overlayClassName = hasActiveOverlayLayer
		? "map-overlays has-timeline"
		: "map-overlays";

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			<MapCanvasLegend
				colorRamp={timelineState.colorRamp}
				unit={LAYER_UNITS[activeLayer] || ""}
				isVisible={hasActiveOverlayLayer}
			/>

			<div className={overlayClassName}>
				{showTimeline && (
					<div className="map-overlays-timeline-slot">
						<TimeLine
							isVisible={showTimeline}
							isPlaying={timelineState.isPlaying}
							startMs={timelineState.startMs}
							endMs={timelineState.endMs}
							currentMs={timelineState.currentMs}
							timezone={activeLocation?.timezone}
							onPlay={handlePlay}
							onPause={handlePause}
							onSeek={handleSeek}
						/>
					</div>
				)}

				<div className="map-overlays-toggle-slot">
					<MapLayerToggle
						activeLayer={activeLayer}
						onLayerChange={onLayerChange}
						showMarkers={showMarkersWithLayer}
						onToggleMarkers={onToggleMarkers}
						onOpenChange={setIsLayerToggleOpen}
					/>
				</div>
			</div>
		</div>
	);
}