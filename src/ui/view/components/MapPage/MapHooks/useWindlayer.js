//src/ui/view/components/MapPage/MapHooks/useWindlayer.js
import { useEffect, useRef, useCallback } from "react";
import { WindLayer, ColorRamp } from "@maptiler/weather";

/**
 * Plasserer WindLayer under label-lagene slik at by-navn
 * forblir lesbare oppå vind-overlayet.
 */
const INSERT_BEFORE_LAYER = "Place labels";

const WIND_COLOR_STOPS = [
	{ value: 0,  color: [176, 216, 144, 255] }, // grønn
	{ value: 4,  color: [136, 208, 128, 255] },
	{ value: 7,  color: [88, 200, 152, 255] },
	{ value: 10, color: [56, 192, 192, 255] }, // cyan
	{ value: 13, color: [48, 168, 216, 255] },
	{ value: 16, color: [56, 136, 224, 255] }, // blå
	{ value: 20, color: [80, 104, 216, 255] },
	{ value: 24, color: [120, 88, 208, 255] },
	{ value: 28, color: [160, 80, 200, 255] },
	{ value: 32, color: [192, 56, 184, 255] }, // lilla
	{ value: 36, color: [214, 72, 168, 255] }, // rosa
];

const WIND_LAYER_OPTIONS = {
	id: "maptiler-wind-layer",

	opacity: 0.6,

	//MOTION (VIKTIG)
	speed: 0.0015,
	fadeFactor: 0.035,

	//VISUAL
	density: 3,
	size: 1,

	color: [255, 255, 255, 40],
	fastColor: [255, 255, 255, 160],
	fastIsLarger: true,
};


/**
 * Bygger en yr.no-inspirert ColorRamp fra WIND_COLOR_STOPS.
 * API: new ColorRamp({ stops: [...] })
 */
function buildYrColorRamp() {
	return new ColorRamp({
		stops: WIND_COLOR_STOPS,
	});
}

export function useWindLayer(map, isActive) {
	const layerRef = useRef(null);

	/* =========================
		OPPRETT LAYER
	========================= */
	const createWindLayer = useCallback(() => {
		return new WindLayer({
			...WIND_LAYER_OPTIONS,
			colorramp: buildYrColorRamp(),
			//valueRange: [0, 33],
			//normalize: false,

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
		} 
		
		catch (error) {
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