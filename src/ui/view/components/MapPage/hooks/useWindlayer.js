//src/ui/view/components/MapPage/hooks/useWindlayer.js
import { useEffect, useRef, useCallback } from "react";
import { WindLayer, ColorRamp } from "@maptiler/weather";
import { WIND_LAYER_OPTIONS } from "../../../../utils/MapUtils/MapModeLayers/Weatherlayerconfig.js";

/**
 * Plasserer WindLayer under label-lagene slik at by-navn
 * forblir lesbare oppå vind-overlayet.
 */
const INSERT_BEFORE_LAYER = "Place labels";

export function useWindLayer(map, isActive) {
	const layerRef = useRef(null);

	/* =========================
		OPPRETT LAYER
	========================= */
	const createWindLayer = useCallback(() => {
		return new WindLayer({
			...WIND_LAYER_OPTIONS,
			colorramp: ColorRamp.builtin.WIND,
		});
	}, []);

	/* =========================
		LEGG TIL PÅ KART
	========================= */
	const addLayerToMap = useCallback(async (windLayer) => {
		try {
			const beforeLayer = map.getLayer(INSERT_BEFORE_LAYER)
				? INSERT_BEFORE_LAYER
				: undefined;

			map.addLayer(windLayer, beforeLayer);
			await windLayer.onSourceReadyAsync();
		} catch (error) {
			console.error("[useWindLayer] Kunne ikke legge til vindlag:", error);
		}
	}, [map]);

	/* =========================
		FJERN FRA KART
	========================= */
	const removeLayerFromMap = useCallback(() => {
		if (!layerRef.current) return;

		try {
			if (map.getLayer(WIND_LAYER_OPTIONS.id)) {
				map.removeLayer(WIND_LAYER_OPTIONS.id);
			}
		} catch (error) {
			console.warn("[useWindLayer] Feil ved fjerning av lag:", error);
		}

		layerRef.current = null;
	}, [map]);

	/* =========================
		EFFECT
	========================= */
	const onActiveChangedToggleLayer = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

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
	}, [map, isActive, createWindLayer, addLayerToMap, removeLayerFromMap]);

	/* =========================
		EFFECT BINDING
	========================= */
	useEffect(onActiveChangedToggleLayer, [onActiveChangedToggleLayer]);
}