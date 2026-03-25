import { useEffect, useRef, useState, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MAP_DEFAULTS, MAP_ZOOM_LEVELS, MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/Constants/MapConstants.js";

export function useMapInit(mapContainerRef, apiKey, style, activeLocation) {

	/* =========================
		STATE
	========================= */
	const [mapInstance, setMapInstance] = useState(null);
	const isInitialized = useRef(false);

	/* =========================
		INITIAL VALUES (FROZEN)
	========================= */
	const initialLon = useRef(activeLocation?.lon ?? MAP_DEFAULTS.CENTER_LON);
	const initialLat = useRef(activeLocation?.lat ?? MAP_DEFAULTS.CENTER_LAT);
	const initialZoom = useRef(MAP_ZOOM_LEVELS.DEFAULT);

	/* =========================
		COMMANDS
	========================= */
	const configureMapLabels = useCallback((map) => {
		MAP_MARKER_CONFIG.LABEL_LAYERS.forEach((layer) => {
			if (map.getLayer(layer)) {
				map.setLayerZoomRange(layer, 0, 24);
			}
		});
	}, []);

	const createMapInstance = useCallback(() => {
		maptilersdk.config.apiKey = apiKey;

		return new maptilersdk.Map({
			container: mapContainerRef.current,
			style: style,
			center: [initialLon.current, initialLat.current],
			zoom: initialZoom.current,
			maxZoom: MAP_ZOOM_LEVELS.DEFAULT,
			minZoom: MAP_ZOOM_LEVELS.WORLD,
			attributionControl: false,
			navigationControl: true,
			geolocateControl: false,
		});
	}, [apiKey, style, mapContainerRef]);

	const destroyMapInstance = useCallback((map) => {
		try {
			map?.remove();
		} 
		
		catch (error) {
			console.warn("[useMapInit] map remove failed:", error);
		}

		isInitialized.current = false;
		setMapInstance(null);
	}, []);

	/* =========================
		CALLBACK TIL USEEFFECT
	========================= */
	const onMountInitializeMap = useCallback(() => {
		if (!mapContainerRef.current || isInitialized.current) return;

		isInitialized.current = true;

		const map = createMapInstance();

		map.on("load", () => {
			configureMapLabels(map);
			setMapInstance(map);
		});

		return () => {
			destroyMapInstance(map);
		};

	}, [createMapInstance, configureMapLabels, destroyMapInstance, mapContainerRef]);

	/* =========================
		USEEFFECT BINDING
	========================= */
	useEffect(onMountInitializeMap, [onMountInitializeMap]);

	/* =========================
		RETURN VALUE
	========================= */
	return mapInstance;
}