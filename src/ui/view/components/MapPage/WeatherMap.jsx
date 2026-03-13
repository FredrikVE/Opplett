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
	/* =========================================================
	   REFS
	========================================================= */
	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markerLayoutRef = useRef(null);
	const activeLayoutMarkersRef = useRef(new Map());
	//const markersRef = useRef([]);
	const markersRef = useRef(new Map());
	const lastMovedIdRef = useRef(null);
	const isInternalMoveRef = useRef(false);

	const activeLocationRef = useRef(activeLocation);
	const onMapChangeRef = useRef(onMapChange);

	/* =========================================================
	   REF SYNC
	========================================================= */
	const syncActiveLocationRef = useCallback(() => {
		activeLocationRef.current = activeLocation;
	}, [activeLocation]);

	const syncOnMapChangeRef = useCallback(() => {
		onMapChangeRef.current = onMapChange;
	}, [onMapChange]);

	/* =========================================================
	   COMMANDS
	========================================================= */
	const buildViewportSnapshot = useCallback((map) => {
		return {
			lat: map.getCenter().lat,
			lon: map.getCenter().lng,
			zoom: map.getZoom(),
			bounds: map.getBounds().toArray()
		};
	}, []);

	const collectVisibleWeatherPoints = useCallback((map, markerLayout) => {
		if (!map || !markerLayout) {
			return [];
		}

		const abstractMarkers = syncAbstractMarkersFromLayout(
			markerLayout,
			activeLayoutMarkersRef.current
		);

		return extractCityPointsFromMarkers({
			abstractMarkers,
			zoom: map.getZoom(),
			activeLocation: activeLocationRef.current
		});
	}, []);

	const reportMapStatus = useCallback((triggerSource = "UNKNOWN") => {
		const map = mapInstanceRef.current;
		const markerLayout = markerLayoutRef.current;

		if (!map || !markerLayout || !map.isStyleLoaded()) {
			return;
		}

		if (isInternalMoveRef.current) {
			console.log(`[WeatherMap] 🤫 Ignorerer statusrapport under flytting (${triggerSource})`);
			return;
		}

		const points = collectVisibleWeatherPoints(map, markerLayout);

		console.log(`[WeatherMap] 📍 reportMapStatus(${triggerSource}) -> ${points?.length ?? 0} punkter`);

		onMapChangeRef.current({
			viewport: buildViewportSnapshot(map),
			points
		});
	}, [buildViewportSnapshot, collectVisibleWeatherPoints]);

	const initializeMap = useCallback(() => {
		if (!mapContainerRef.current || mapInstanceRef.current) {
			return;
		}

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

			requestAnimationFrame(() => {
				reportMapStatus("MAP_LOAD");
			});
		});

		map.on("idle", () => {
			isInternalMoveRef.current = false;

			requestAnimationFrame(() => {
				reportMapStatus("EVENT_IDLE");
			});
		});

		mapInstanceRef.current = map;
	}, [apiKey, style, reportMapStatus]);

	const destroyMap = useCallback(() => {
		markerLayoutRef.current = null;
		activeLayoutMarkersRef.current.clear();

		if (mapInstanceRef.current) {
			mapInstanceRef.current.remove();
			mapInstanceRef.current = null;
		}
	}, []);

	const moveMapToTarget = useCallback(() => {
		const map = mapInstanceRef.current;

		if (!map || !map.isStyleLoaded() || !mapTarget) {
			return;
		}

		if (lastMovedIdRef.current === mapTarget.id) {
			return;
		}

		lastMovedIdRef.current = mapTarget.id;
		isInternalMoveRef.current = true;

		activeLayoutMarkersRef.current.clear();

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

	const syncHighlightOnMap = useCallback(() => {
		if (!mapInstanceRef.current) {
			return;
		}

		syncMapHighlight(mapInstanceRef.current, highlightGeometry);
	}, [highlightGeometry]);

	const syncWeatherMarkersOnMap = useCallback(() => {
		if (!mapInstanceRef.current) {
			return;
		}

		renderWeatherMarkers({
			map: mapInstanceRef.current,
			markersRef,
			weatherPoints
		});
	}, [weatherPoints]);

	/* =========================================================
	   EFFECT ACTIONS
	========================================================= */
	const onActiveLocationChangedSyncRef = useCallback(() => {
		syncActiveLocationRef();
	}, [syncActiveLocationRef]);

	const onOnMapChangeChangedSyncRef = useCallback(() => {
		syncOnMapChangeRef();
	}, [syncOnMapChangeRef]);

	const onMountedInitializeMap = useCallback(() => {
		initializeMap();

		return () => {
			destroyMap();
		};
	}, [initializeMap, destroyMap]);

	const onMapTargetChangedMoveMap = useCallback(() => {
		moveMapToTarget();
	}, [moveMapToTarget]);

	const onHighlightGeometryChangedSyncHighlight = useCallback(() => {
		syncHighlightOnMap();
	}, [syncHighlightOnMap]);

	const onWeatherPointsChangedSyncMarkers = useCallback(() => {
		syncWeatherMarkersOnMap();
	}, [syncWeatherMarkersOnMap]);

	/* =========================================================
	   EFFECTS
	========================================================= */
	useEffect(onActiveLocationChangedSyncRef, [onActiveLocationChangedSyncRef]);
	useEffect(onOnMapChangeChangedSyncRef, [onOnMapChangeChangedSyncRef]);
	useEffect(onMountedInitializeMap, [onMountedInitializeMap]);
	useEffect(onMapTargetChangedMoveMap, [onMapTargetChangedMoveMap]);
	useEffect(onHighlightGeometryChangedSyncHighlight, [onHighlightGeometryChangedSyncHighlight]);
	useEffect(onWeatherPointsChangedSyncMarkers, [onWeatherPointsChangedSyncMarkers]);

	/* =========================================================
	   VIEW
	========================================================= */
	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}