import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { MAP_ANIMATION, MAP_MARKER_CONFIG, MAP_ZOOM_LEVELS, MAP_CAMERA } from "../../../utils/MapUtils/MapConfig.js";
import { extractCityPointsFromMarkers } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { syncMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {
	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markerLayoutRef = useRef(null);
	const activeLayoutMarkersRef = useRef(new Map());
	const markersRef = useRef([]);
	const lastMovedId = useRef(null);
	const isInternalMove = useRef(false);

	const activeLocationRef = useRef(activeLocation);
	const onMapChangeRef = useRef(onMapChange);

	useEffect(() => {
		activeLocationRef.current = activeLocation;
	}, [activeLocation]);

	useEffect(() => {
		onMapChangeRef.current = onMapChange;
	}, [onMapChange]);

	const reportMapStatus = useCallback(() => {
		const map = mapInstanceRef.current;
		const markerLayout = markerLayoutRef.current;

		if (!map || !markerLayout || !map.isStyleLoaded()) return;
		if (isInternalMove.current) return;

		const abstractMarkers = syncAbstractMarkersFromLayout(
			markerLayout,
			activeLayoutMarkersRef.current
		);

		const points = extractCityPointsFromMarkers({
			abstractMarkers,
			zoom: map.getZoom(),
			activeLocation: activeLocationRef.current
		});

		onMapChangeRef.current({
			viewport: {
				lat: map.getCenter().lat,
				lon: map.getCenter().lng,
				zoom: map.getZoom(),
				bounds: map.getBounds().toArray()
			},
			points
		});
	}, []);

	useEffect(() => {
		if (!mapContainerRef.current || mapInstanceRef.current) return;

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style,
			center: [
				activeLocationRef.current?.lon ?? 0,
				activeLocationRef.current?.lat ?? 0
			],
			zoom: MAP_ZOOM_LEVELS.DISTRICT,
			attributionControl: false
		});

		map.on("load", () => {
			markerLayoutRef.current = new MarkerLayout(map, {
				layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
				max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
				sortingProperty: getFeaturePriorityScore
			});
		});

		map.on("idle", () => {
			isInternalMove.current = false;
			reportMapStatus();
		});

		mapInstanceRef.current = map;

		return () => {
			markerLayoutRef.current = null;
			activeLayoutMarkersRef.current.clear();

			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [apiKey, style, reportMapStatus]);

	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map || !map.isStyleLoaded() || !mapTarget) return;
		if (lastMovedId.current === mapTarget.id) return;

		lastMovedId.current = mapTarget.id;
		isInternalMove.current = true;

		console.log(`[WeatherMap] 🚀 Starter programmert flytt: ${mapTarget.id}`);

		if (mapTarget.type === MAP_CAMERA.BOUNDS) {
			map.fitBounds(mapTarget.data, {
				padding: mapTarget.isArea
					? MAP_ANIMATION.PADDING.AREA
					: MAP_ANIMATION.PADDING.POINT,
				duration: MAP_ANIMATION.DURATION_MS,
				essential: true
			});
			return;
		}

		map.flyTo({
			center: [mapTarget.data.lon, mapTarget.data.lat],
			zoom: mapTarget.data.zoom,
			speed: MAP_ANIMATION.FLY_SPEED,
			essential: true
		});
	}, [mapTarget]);

	useEffect(() => {
		if (mapInstanceRef.current) {
			syncMapHighlight(mapInstanceRef.current, highlightGeometry);
		}
	}, [highlightGeometry]);

	useEffect(() => {
		if (mapInstanceRef.current) {
			renderWeatherMarkers({
				map: mapInstanceRef.current,
				markersRef,
				weatherPoints
			});
		}
	}, [weatherPoints]);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}