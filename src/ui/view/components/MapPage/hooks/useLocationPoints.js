// src/ui/view/components/MapPage/hooks/useLocationPoints.js
//
// Bruker MarkerLayout til å finne synlige byer/steder,
// og rapporterer punkter for værhenting via onMapChange.
//
// highlightGeometry brukes til å prioritere byer innenfor
// valgt område (f.eks. Helsinki foran Tallinn for Finland).

import { useEffect, useRef } from "react";
import { MarkerLayout } from "@maptiler/marker-layout";
import { MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/Constants/MapConstants.js";
import { distributeWeatherPoints } from "../../../../utils/MapUtils/Icons/DistributeWeatherPoints.js";
import { getFeaturePriorityScore } from "../../../../utils/MapUtils/Icons/CalculateFeaturePriority.js";

export function useLocationPoints(map, activeLocation, highlightGeometry, onMapChange) {
	const layoutRef = useRef(null);
	const activeMarkersRef = useRef(new Map());

	useEffect(() => {
		if (!map) return;

		const activeMarkers = activeMarkersRef.current;

		layoutRef.current = new MarkerLayout(map, {
			layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
			markerAnchor: "center",
			max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
			sortingProperty: getFeaturePriorityScore,
		});

		const handleFullUpdate = () => {
			const layout = layoutRef.current;
			if (!layout) return;

			const status = layout.update();

			if (status) {
				status.removed?.forEach((am) => activeMarkers.delete(am.id));
				status.updated?.forEach((am) => activeMarkers.set(am.id, am));
				status.new?.forEach((am) => activeMarkers.set(am.id, am));
			}

			const allMarkers = Array.from(activeMarkers.values());
			const points = distributeWeatherPoints(
				allMarkers,
				map.getZoom(),
				highlightGeometry
			);

			onMapChange({
				viewport: {
					lat: map.getCenter().lat,
					lon: map.getCenter().lng,
					zoom: map.getZoom(),
					bounds: map.getBounds().toArray(),
				},
				points,
			});
		};

		const handleSoftUpdate = () => {
			const layout = layoutRef.current;
			if (!layout) return;

			activeMarkers.forEach((marker) => {
				try {
					layout.softUpdateAbstractMarker(marker);
				} catch (err) {
					console.warn("[useLocationPoints] softUpdate feilet:", err);
				}
			});
		};

		map.on("move", handleSoftUpdate);
		map.on("moveend", handleFullUpdate);
		map.on("idle", handleFullUpdate);

		handleFullUpdate();

		return () => {
			map.off("move", handleSoftUpdate);
			map.off("moveend", handleFullUpdate);
			map.off("idle", handleFullUpdate);
			layoutRef.current = null;
			activeMarkers.clear();
		};
	}, [map, highlightGeometry, onMapChange]);
}