//src/ui/view/components/MapPage/hooks/useWeatherMarkers.jsx
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../WeatherSymbolLabel.jsx";

function disposeMarkerEntry(entry) {
	try {
		entry.marker?.remove();
	} 
	
	catch (error) {
		console.warn("[useWeatherMarkers] marker remove failed:", error);
	}

	queueMicrotask(() => {
		try {
			entry.root?.unmount();
		} 
		
		catch (error) {
			console.warn("[useWeatherMarkers] root unmount failed:", error);
		}
	});
}

export function useWeatherMarkers(map, weatherPoints) {

	const markersRef = useRef(new Map());

	const createMarker = useCallback((point) => {
		const container = document.createElement("div");
		container.className = "map-weather-marker-container";

		const root = createRoot(container);
		root.render(<WeatherSymbolLabel point={point} />);

		const marker = new maptilersdk.Marker({
			element: container,
			anchor: "center"
		})
			.setLngLat([point.lon, point.lat])
			.addTo(map);

		return { marker, root, container };
	}, 

	[map]);

	const updateMarker = useCallback((entry, point) => {
		entry.marker.setLngLat([point.lon, point.lat]);
		entry.root.render(<WeatherSymbolLabel point={point} />);
	}, 
	
	[]);

	const removeMarker = useCallback((id, markers) => {
		const entry = markers.get(id);
		if (!entry) {
			return;
		}

		disposeMarkerEntry(entry);
		markers.delete(id);
	}, 
	
	[]);

	const onWeatherPointsChangedSyncMarkers = useCallback(() => {
		if (!map) {
			return;
		}

		const markers = markersRef.current;

		const nextIds = new Set(
			weatherPoints?.map((p) => p.id).filter(Boolean) ?? []
		);

		//Upsert markers
		for (const point of weatherPoints ?? []) {
			if (!point?.id) {
				continue;
			}

			const existing = markers.get(point.id);

			if (existing) {
				updateMarker(existing, point);
				continue;
			}

			const entry = createMarker(point);
			markers.set(point.id, entry);
		}

		//Remove stale markers
		for (const [id] of markers) {
			if (nextIds.has(id)) {
				continue;
			}
			removeMarker(id, markers);
		}

		//Clean up med cleanup-function
		return () => {
			for (const [, entry] of markers) {
				disposeMarkerEntry(entry);
			}
			markers.clear();
		};

	}, 
	[map, weatherPoints, createMarker, updateMarker, removeMarker]);

	//Useffects
	useEffect(onWeatherPointsChangedSyncMarkers, 
		[onWeatherPointsChangedSyncMarkers]);
}