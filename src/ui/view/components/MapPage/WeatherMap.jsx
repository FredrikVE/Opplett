//src/ui/view/components/MapPage/WeatherMap.jsx
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { useMapInit } from "./MapHooks/useMapInit.js";
import { useMapCamera } from "./MapHooks/useMapCamera.js";
import { useMapHighlight } from "./MapHooks/useMapHighlight.js";
import { useLocationPoints } from "./MapHooks/useLocationPoints.js";
import { useWeatherMarkers } from "./MapHooks/useWeatherMarkers.jsx";
import { useDeviceLocationDot } from "./MapHooks/useDeviceLocationDot.js";
import { useWindLayer } from "./MapHooks/useWindlayer.js";
import { usePrecipitationLayer } from "./MapHooks/usePrecipitationLayer.js";
import { usePressureLayer } from "./MapHooks/usePressureLayer.js";
import { useTemperatureLayer } from "./MapHooks/useTemperatureLayer.js";
import { useMapLayerDimming } from "./MapHooks/useMapLayerDimming.js";
import { useTimelineController } from "./MapHooks/useTimelineController.js";

import WindLegend from "./Windmap/WindLegend.jsx";
import PrecipitationLegend from "./PrecipitationMap/Precipitationlegend.jsx";
import TemperatureLegend from "./TemperatureMap/TemperatureLegend.jsx";
import PressureLegend from "./PressureMap/PressureLegend.jsx";

import MapLayerToggle from "./MapLayerToggle/MapLayerToggle.jsx";
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

	const isWindActive = activeLayer === LAYER_KEYS.WIND;
	const windControls = useWindLayer(map, isWindActive, onTimeUpdate);

	const isPrecipActive = activeLayer === LAYER_KEYS.PRECIPITATION;
	const precipControls = usePrecipitationLayer(map, isPrecipActive, onTimeUpdate);
	useMapLayerDimming(map, isPrecipActive);

	const isPressureActive = activeLayer === LAYER_KEYS.PRESSURE;
	const pressureControls = usePressureLayer(map, isPressureActive, onTimeUpdate);

	const isTemperatureLayerActive = activeLayer === LAYER_KEYS.TEMPERATURE;
	const temperatureControls = useTemperatureLayer(map, isTemperatureLayerActive, onTimeUpdate);

	const activeTimelineLayer = useMemo(() => {
		if (isPrecipActive) return precipControls;
		if (isWindActive) return windControls;
		if (isPressureActive) return pressureControls;
		if (isTemperatureLayerActive) return temperatureControls;
		return null;
	}, [
		isPrecipActive,
		isWindActive,
		isPressureActive,
		isTemperatureLayerActive,
		temperatureControls,
		precipControls,
		windControls,
		pressureControls,
	]);

	const handlePlay = useCallback(() => {
		activeTimelineLayer?.play?.();
		play();
	}, [activeTimelineLayer, play]);

	const handlePause = useCallback(() => {
		activeTimelineLayer?.pause?.();
		pause();
	}, [activeTimelineLayer, pause]);

	const handleSeek = useCallback((timestampMs) => {
		activeTimelineLayer?.seekTo?.(timestampMs);
	}, [activeTimelineLayer]);

	const onActiveLayerChangedResetTimeline = useCallback(() => {
		if (!activeTimelineLayer) {
			onTimeUpdate({ type: "removed" });
		}
	}, [activeTimelineLayer, onTimeUpdate]);

	useEffect(onActiveLayerChangedResetTimeline, [onActiveLayerChangedResetTimeline]);

	const shouldShowMarkers = activeLayer === LAYER_KEYS.NONE || showMarkersWithLayer;
	useWeatherMarkers(map, shouldShowMarkers ? weatherPoints : []);

	const hasActiveOverlayLayer =
		isPrecipActive || isWindActive || isPressureActive || isTemperatureLayerActive;

	const showTimeline = hasActiveOverlayLayer && !isLayerToggleOpen;

	const overlayClassName = hasActiveOverlayLayer
		? "map-overlays has-timeline"
		: "map-overlays";

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			<WindLegend isVisible={isWindActive} />
			<PrecipitationLegend isVisible={isPrecipActive} />
			<TemperatureLegend isVisible={isTemperatureLayerActive} />
			<PressureLegend isVisible={isPressureActive} />

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