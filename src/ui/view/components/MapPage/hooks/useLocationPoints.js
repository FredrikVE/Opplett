//src/ui/view/components/MapPage/hooks/useLocationPoints.js
import { useEffect, useRef, useCallback } from "react";
import { MarkerLayout } from "@maptiler/marker-layout";
import { distributeWeatherPoints } from "../../../../utils/MapUtils/Icons/DistributeWeatherPoints.js";
import { getFeaturePriorityScore } from "../../../../utils/MapUtils/Icons/CalculateFeaturePriority.js";

const MAP_LABEL_LAYERS = [
	"Capital city labels",
	"City labels",
	"Town labels",
	"Place labels"
];

//Maks antall markers MarkerLayout får håndtere
const MAX_LAYOUT_MARKERS = 60;

export function useLocationPoints(map, countryCode, onMapChange) {

	const layoutRef = useRef(null);
	const activeMarkersRef = useRef(new Map());


	const createLayout = useCallback(() => {
		return new MarkerLayout(map, {
			layers: MAP_LABEL_LAYERS,
			markerAnchor: "center",
			max: MAX_LAYOUT_MARKERS,
			sortingProperty: getFeaturePriorityScore,
		});
	}, 
	
	[map]);

	const applyLayoutDiff = useCallback((status, activeMarkers) => {
		if (!status) {
			return;
		}

		status.removed?.forEach((am) => activeMarkers.delete(am.id));
		status.updated?.forEach((am) => activeMarkers.set(am.id, am));
		status.new?.forEach((am) => activeMarkers.set(am.id, am));
	}, 
	
	[]);

	const computeWeatherPoints = useCallback((activeMarkers) => {
		const allMarkers = Array.from(activeMarkers.values());

		return distributeWeatherPoints(
			allMarkers,
			map.getZoom(),
			map.getBounds().toArray(),
			countryCode
		);
	}, 
	
	[map, countryCode]);

	const emitMapChange = useCallback((points) => {
		onMapChange({
			viewport: {
				lat: map.getCenter().lat,
				lon: map.getCenter().lng,
				zoom: map.getZoom(),
				bounds: map.getBounds().toArray(),
			},
			points,
		});
	}, 
	
	[map, onMapChange]);

	const runFullUpdate = useCallback(() => {
		const layout = layoutRef.current;
		if (!layout) return;

		const activeMarkers = activeMarkersRef.current;

		const status = layout.update();
		applyLayoutDiff(status, activeMarkers);

		const points = computeWeatherPoints(activeMarkers);
		emitMapChange(points);

	}, 

	[applyLayoutDiff, computeWeatherPoints, emitMapChange]);

	const runSoftUpdate = useCallback(() => {
		const layout = layoutRef.current;
		if (!layout) return;

		const activeMarkers = activeMarkersRef.current;

		activeMarkers.forEach((marker) => {
			try {
				layout.softUpdateAbstractMarker(marker);
			} catch (error) {
				console.warn("[useLocationPoints] softUpdate feilet:", error);
			}
		});
	}, 

	[]);

	const destroyLayout = useCallback(() => {
		layoutRef.current = null;
		activeMarkersRef.current.clear();
	}, 
	
	[]);

	/* =========================
		EFFECT (EVENT STYLE)
	========================= */

	const onMapReadyInitializeLayout = useCallback(() => {
		if (!map) {
			return;
		}

		layoutRef.current = createLayout();

		map.on("move", runSoftUpdate);
		map.on("moveend", runFullUpdate);
		map.on("idle", runFullUpdate);

		runFullUpdate();

		return () => {
			map.off("move", runSoftUpdate);
			map.off("moveend", runFullUpdate);
			map.off("idle", runFullUpdate);

			destroyLayout();
		};

	}, [map, createLayout, runSoftUpdate, runFullUpdate, destroyLayout]);

	/* =========================
		EFFECT BINDING
	========================= */
	useEffect(onMapReadyInitializeLayout, [
		onMapReadyInitializeLayout
	]);
}