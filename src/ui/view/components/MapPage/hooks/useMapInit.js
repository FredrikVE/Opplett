// src/ui/view/components/MapPage/hooks/useMapInit.js
import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MAP_DEFAULTS, MAP_ZOOM_LEVELS } from "../../../../utils/MapUtils/Constants/MapConstants.js";

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
			attributionControl: false,
			navigationControl: true,
			geolocateControl: false,
		});

		map.on("load", () => {
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