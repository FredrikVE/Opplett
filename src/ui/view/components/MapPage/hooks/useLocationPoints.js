//src/ui/view/components/MapPage/hooks/useVisiblePlacePoints.js
import { useEffect, useRef } from "react";
import { MarkerLayout } from "@maptiler/marker-layout";
import { MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/Constants/MapConstants.js";
import { distributeWeatherPoints } from "../../../../utils/MapUtils/Icons/DistributeWeatherPoints.js";
import { getFeaturePriorityScore } from "../../../../utils/MapUtils/Icons/CalculateFeaturePriority.js";
import { updateWeatherMarkers } from "../../../../utils/MapUtils/Icons/UpdateWeatherMarkers.js";


export function useLocationPoints(map, activeLocation, onMapChange) {
	const markerLayoutRef = useRef(null);
	const layoutMarkersRef = useRef(new Map());

	useEffect(() => {
		if (!map) {
			return;
		}

		const currentLayoutMarkers = layoutMarkersRef.current;
		const { MIN, MAX } = MAP_MARKER_CONFIG.LABEL_LAYER_ZOOM_RANGE;

		MAP_MARKER_CONFIG.LABEL_LAYERS.forEach((layerId) => {
			if (map.getLayer(layerId)) {
				map.setLayerZoomRange(layerId, MIN, MAX);
			}
		});

		markerLayoutRef.current = new MarkerLayout(map, {
			layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
			markerAnchor: "center",
			max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
			sortingProperty: getFeaturePriorityScore,
			sortingOrder: "ascending"
		});

		const handleFullUpdate = () => {
			if (!markerLayoutRef.current) {
				return;
			}

			const abstractMarkers = updateWeatherMarkers(
				markerLayoutRef.current,
				currentLayoutMarkers
			);

			const points = distributeWeatherPoints(
				abstractMarkers,
				map.getZoom(),
				activeLocation
			);

			onMapChange({
				viewport: {
					lat: map.getCenter().lat,
					lon: map.getCenter().lng,
					zoom: map.getZoom(),
					bounds: map.getBounds().toArray()
				},
				points
			});
		};

		const handleSoftUpdate = () => {
			if (!markerLayoutRef.current) {
				return;
			}

			currentLayoutMarkers.forEach((marker) => {
				try {
					markerLayoutRef.current.softUpdateAbstractMarker(marker);
				} catch (error) {
					console.warn("[useVisiblePlacePoints] softUpdateAbstractMarker feilet:", error);
				}
			});
		};

		map.on("move", handleSoftUpdate);
		map.on("idle", handleFullUpdate);

		handleFullUpdate();

		return () => {
			map.off("move", handleSoftUpdate);
			map.off("idle", handleFullUpdate);
			markerLayoutRef.current = null;
			currentLayoutMarkers.clear();
		};
	}, [map, activeLocation, onMapChange]);
}