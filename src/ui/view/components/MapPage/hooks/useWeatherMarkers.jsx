//src/ui/view/components/MapPage/hooks/useWeatherMarkers.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../WeatherSymbolLabel.jsx";

function disposeMarkerEntry(entry) {
	try {
		entry.marker?.remove();
	} catch (error) {
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

	useEffect(() => {
		if (!map) return;

		const markers = markersRef.current;
		const nextIds = new Set(weatherPoints?.map((p) => p.id).filter(Boolean) ?? []);

		for (const point of weatherPoints ?? []) {
			if (!point?.id) continue;

			const existing = markers.get(point.id);

			if (existing) {
				existing.marker.setLngLat([point.lon, point.lat]);
				existing.root.render(<WeatherSymbolLabel point={point} />);
				continue;
			}

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

			markers.set(point.id, { marker, root, container });
		}

		for (const [id, entry] of markers) {
			if (nextIds.has(id)) continue;
			disposeMarkerEntry(entry);
			markers.delete(id);
		}

		return () => {
			for (const [, entry] of markers) {
				disposeMarkerEntry(entry);
			}
			markers.clear();
		};
	}, [map, weatherPoints]);
}