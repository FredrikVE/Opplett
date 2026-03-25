import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../WeatherSymbolLabel.jsx";

/* =========================
	HELPERS (OUTSIDE HOOK)
========================= */

function disposeMarkerEntry(entry) {
	try {
		entry.marker?.remove();
	} catch (error) {
		console.warn("[useWeatherMarkers] marker remove failed:", error);
	}

	queueMicrotask(() => {
		try {
			entry.root?.unmount();
		} catch (error) {
			console.warn("[useWeatherMarkers] root unmount failed:", error);
		}
	});
}

/* =========================
	HOOK
========================= */

export function useWeatherMarkers(map, weatherPoints) {

	/* =========================
		STATE (REFS)
	========================= */

	const markersRef = useRef(new Map());

	/* =========================
		COMMANDS
	========================= */

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
	}, [map]);

	const updateMarker = useCallback((entry, point) => {
		entry.marker.setLngLat([point.lon, point.lat]);
		entry.root.render(<WeatherSymbolLabel point={point} />);
	}, []);

	const removeMarker = useCallback((id, markers) => {
		const entry = markers.get(id);
		if (!entry) {
			return;
		}

		disposeMarkerEntry(entry);
		markers.delete(id);
	}, []);

	/* =========================
		EFFECT (EVENT STYLE)
	========================= */

	const onWeatherPointsChangedSyncMarkers = useCallback(() => {
		if (!map) return;

		const markers = markersRef.current;

		const nextIds = new Set(
			weatherPoints?.map((p) => p.id).filter(Boolean) ?? []
		);

		/* === UPSERT MARKERS === */
		for (const point of weatherPoints ?? []) {
			if (!point?.id) continue;

			const existing = markers.get(point.id);

			if (existing) {
				updateMarker(existing, point);
				continue;
			}

			const entry = createMarker(point);
			markers.set(point.id, entry);
		}

		/* === REMOVE STALE MARKERS === */
		for (const [id] of markers) {
			if (nextIds.has(id)) continue;
			removeMarker(id, markers);
		}

		/* === CLEANUP === */
		return () => {
			for (const [, entry] of markers) {
				disposeMarkerEntry(entry);
			}
			markers.clear();
		};

	}, [map, weatherPoints, createMarker, updateMarker, removeMarker]);

	/* =========================
		EFFECT BINDING
	========================= */
	useEffect(onWeatherPointsChangedSyncMarkers, 
		[onWeatherPointsChangedSyncMarkers]);
}