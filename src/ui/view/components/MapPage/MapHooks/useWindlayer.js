//src/ui/view/components/MapPage/MapHooks/useWindlayer.js
import { useEffect, useRef, useCallback } from "react";
import { WindLayer, ColorRamp } from "@maptiler/weather";
import { buildWindColorStops } from "../Windmap/WindScale";
import { WIND_LAYER_OPTIONS } from "../Windmap/WindLayerOptions";

const INSERT_BEFORE_LAYER = "Place labels";

export function useWindLayer(map, isActive) {
	const layerRef = useRef(null);

	const createWindLayer = useCallback(() => {
		return new WindLayer({
			...WIND_LAYER_OPTIONS,
			colorramp: new ColorRamp({
				stops: buildWindColorStops()
			})
		});
	}, 
	[]);

	const addLayerToMap = useCallback(async (windLayer) => {
		try {
			let beforeLayer;

			if (map.getLayer(INSERT_BEFORE_LAYER)) {
				beforeLayer = INSERT_BEFORE_LAYER;
			}

			map.addLayer(windLayer, beforeLayer);
			await windLayer.onSourceReadyAsync();
		}
		catch (error) {
			console.error("[useWindLayer] Kunne ikke legge til vindlag:", error);
		}
	}, 
	[map]);



	const removeLayerFromMap = useCallback(() => {
		if (!layerRef.current) {
			return;
		}

		try {
			if (map.getLayer(WIND_LAYER_OPTIONS.id)) {
				map.removeLayer(WIND_LAYER_OPTIONS.id);
			}
		}

		catch (error) {
			console.warn("[useWindLayer] Feil ved fjerning av lag:", error);
		}

		layerRef.current = null;
	}, 
	[map]);

	const onActiveChangedToggleLayer = useCallback(() => {
		if (!map || !map.isStyleLoaded()) {
			return;
		}

		if (isActive && !layerRef.current) {
			const windLayer = createWindLayer();
			layerRef.current = windLayer;
			addLayerToMap(windLayer);
		}

		if (!isActive && layerRef.current) {
			removeLayerFromMap();
		}

		return () => {
			if (layerRef.current) {
				removeLayerFromMap();
			}
		};
	}, 
	[map, isActive, createWindLayer, addLayerToMap, removeLayerFromMap]);

	useEffect(onActiveChangedToggleLayer, [onActiveChangedToggleLayer]);
}