//src/ui/view/components/MapPage/MapHooks/useMapInit.js
import { useEffect, useRef, useState, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_LEVELS } from "../../../../utils/MapUtils/Zoom/ZoomConfig";
import { MAP_LABEL_LAYERS } from "../../../../utils/MapUtils/Layers/LayerConfig";
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const DEFAULT_ZOOM = ZOOM_LEVELS.SUBREGION; //Zoomnivå 7 som standard

export function useMapInit(mapContainerRef, mapStyle, activeLocation) {

	const [mapInstance, setMapInstance] = useState(null);
	const isInitialized = useRef(false);
	const initialLon = useRef(activeLocation?.lon);
	const initialLat = useRef(activeLocation?.lat);
	const initialZoom = useRef(DEFAULT_ZOOM);

	const configureMapLabels = useCallback((map) => {
		
		MAP_LABEL_LAYERS.forEach((layer) => {
			if (map.getLayer(layer)) {
				map.setLayerZoomRange(layer, 0, 24);
			}
		});
	}, 

	[]);

	const createMapInstance = useCallback(() => {
		maptilersdk.config.apiKey = MAPTILER_API_KEY;

		return new maptilersdk.Map({
			container: mapContainerRef.current,
			style: mapStyle,
			center: [initialLon.current, initialLat.current],
			zoom: initialZoom.current,
			maxZoom: MAX_ZOOM,
			minZoom: MIN_ZOOM,
			attributionControl: false,
			navigationControl: true,
			geolocateControl: false,
		});
	}, 

	[mapStyle, mapContainerRef]);

	const destroyMapInstance = useCallback((map) => {
		try {
			map?.remove();
		} 
		
		catch (error) {
			console.warn("[useMapInit] map remove failed:", error);
		}

		isInitialized.current = false;
		setMapInstance(null);
	}, 
	
	[]);

	/* =========================
		CALLBACK TIL USEEFFECT
	========================= */
	const onMountInitializeMap = useCallback(() => {
		if (!mapContainerRef.current || isInitialized.current) return;

		isInitialized.current = true;

		const map = createMapInstance();

		map.on("load", () => {
			configureMapLabels(map);
			window.__map = map;  // ← legg til denne midlertidig
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