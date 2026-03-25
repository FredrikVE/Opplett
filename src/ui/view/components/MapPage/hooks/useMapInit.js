// src/ui/view/components/MapPage/hooks/useMapInit.js
import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MAP_DEFAULTS, MAP_ZOOM_LEVELS, MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/Constants/MapConstants.js";

export function useMapInit(mapContainerRef, apiKey, style, activeLocation) {
	const [mapInstance, setMapInstance] = useState(null);
	const isInitialized = useRef(false);

	// Frys startverdiene — disse brukes KUN ved første init
	const initialLon = useRef(activeLocation?.lon ?? MAP_DEFAULTS.CENTER_LON);
	const initialLat = useRef(activeLocation?.lat ?? MAP_DEFAULTS.CENTER_LAT);
	const initialZoom = useRef(MAP_ZOOM_LEVELS.DEFAULT); // 14

	useEffect(() => {
		if (!mapContainerRef.current || isInitialized.current) {
			return;
		}

		isInitialized.current = true;
		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
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

		map.on("load", () => {
			// Åpne label-lagene for alle zoom-nivåer.
			// Uten dette returnerer MarkerLayout ingen byer under zoom ~3
			// fordi kartstilen skjuler label-lagene på lav zoom.
			MAP_MARKER_CONFIG.LABEL_LAYERS.forEach((layer) => {
				if (map.getLayer(layer)) {
					map.setLayerZoomRange(layer, 0, 24);
				}
			});

			setMapInstance(map);
		});

		return () => {
			map.remove();
			isInitialized.current = false;
			setMapInstance(null);
		};
	}, [apiKey, style, mapContainerRef]);

	return mapInstance;
}