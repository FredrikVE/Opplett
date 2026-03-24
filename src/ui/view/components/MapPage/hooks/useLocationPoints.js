// src/ui/view/components/MapPage/hooks/useLocationPoints.js
import { useEffect, useRef } from "react";
import { MarkerLayout } from "@maptiler/marker-layout";
import { MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/Constants/MapConstants.js";
import { distributeWeatherPoints } from "../../../../utils/MapUtils/Icons/DistributeWeatherPoints.js";
import { getFeaturePriorityScore } from "../../../../utils/MapUtils/Icons/CalculateFeaturePriority.js";

export function useLocationPoints(map, activeLocation, onMapChange) {
	const layoutRef = useRef(null);
	const activeMarkersRef = useRef(new Map());

	useEffect(() => {
		if (!map) {
			return;
		}

		const activeMarkers = activeMarkersRef.current;

		// Opprett MarkerLayout — MapTiler håndterer collision detection
		layoutRef.current = new MarkerLayout(map, {
			layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
			markerAnchor: "center",
			max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
			sortingProperty: getFeaturePriorityScore,
			sortingOrder: "ascending"
		});

		/**
		 * Full update: kaller layout.update() og synker til activeMarkers.
		 * Kjøres på "moveend" og ved init.
		 */
		const handleFullUpdate = () => {
			const layout = layoutRef.current;
			if (!layout) {
				return;
			}

			const status = layout.update();

			if (status) {
				// Sync marker store (inlinet fra UpdateWeatherMarkers.js)
				status.removed?.forEach((am) => activeMarkers.delete(am.id));
				status.updated?.forEach((am) => activeMarkers.set(am.id, am));
				status.new?.forEach((am) => activeMarkers.set(am.id, am));
			}

			// Distribuer punkter for værhenting
			const allMarkers = Array.from(activeMarkers.values());
			const points = distributeWeatherPoints(allMarkers, map.getZoom());

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

		/**
		 * Soft update: oppdaterer kun posisjoner uten full recalc.
		 * Kjøres på "move" (mange ganger per sekund under pan/zoom).
		 */
		const handleSoftUpdate = () => {
			const layout = layoutRef.current;
			if (!layout) {
				return;
			}

			activeMarkers.forEach((marker) => {
				try {
					layout.softUpdateAbstractMarker(marker);
				} 

				catch (err) {
					console.warn("[useLocationPoints] softUpdate feilet:", err);
				}
			});
		};

		// Events som MapTiler-dokumentasjonen anbefaler
		map.on("move", handleSoftUpdate);
		map.on("moveend", handleFullUpdate);

		// Initial update
		handleFullUpdate();

		return () => {
			map.off("move", handleSoftUpdate);
			map.off("moveend", handleFullUpdate);
			layoutRef.current = null;
			activeMarkers.clear();
		};
	}, [map, activeLocation, onMapChange]);
}