//src/ui/view/components/MapPage/MapHooks/usePrecipitationLayer.js
import { useEffect, useRef, useCallback } from "react";
import { PrecipitationLayer, ColorRamp } from "@maptiler/weather";

/**
 * Plasserer PrecipitationLayer under label-lagene slik at by-navn
 * forblir lesbare oppå nedbør-overlayet.
 */
const INSERT_BEFORE_LAYER = "Place labels";

/**
 * yr.no-inspirert fargeskala for nedbør.
 * Blåtoner som er godt synlige mot kartet.
 * value = mm/t
 */
/**
 * yr.no-inspirert fargeskala med skarpe, diskrete trinn.
 * Høy alpha + få steg = tydelig "blokk"-effekt.
 * Cyan/blå-dominert som yr.no sin radar.
 */
const PRECIP_COLOR_STOPS = [
	{ value: 0,    color: [200, 220, 240,   0] },   // Transparent (ingen nedbør)
	{ value: 0.09, color: [200, 220, 240,   0] },   // Fortsatt transparent
	{ value: 0.1,  color: [185, 225, 255, 140] },   // Svak lysblå – hopp inn
	{ value: 0.19, color: [185, 225, 255, 140] },   // Hold
	{ value: 0.2,  color: [135, 206, 250, 190] },   // Lys himmelblå
	{ value: 0.49, color: [135, 206, 250, 190] },   // Hold
	{ value: 0.5,  color: [ 80, 185, 245, 210] },   // Klar cyan
	{ value: 0.99, color: [ 80, 185, 245, 210] },   // Hold
	{ value: 1,    color: [ 30, 160, 235, 225] },   // Sterk cyan
	{ value: 1.99, color: [ 30, 160, 235, 225] },   // Hold
	{ value: 2,    color: [ 20, 120, 220, 235] },   // Mellomblå
	{ value: 4.99, color: [ 20, 120, 220, 235] },   // Hold
	{ value: 5,    color: [ 10,  75, 200, 245] },   // Dyp blå
	{ value: 9.99, color: [ 10,  75, 200, 245] },   // Hold
	{ value: 10,   color: [ 40,  40, 180, 250] },   // Blålilla
	{ value: 14.9, color: [ 40,  40, 180, 250] },   // Hold
	{ value: 15,   color: [120,  20, 160, 250] },   // Lilla
	{ value: 50,   color: [120,  20, 160, 250] },   // Hold til maks
];

function buildYrPrecipColorRamp() {
	return new ColorRamp({
		stops: PRECIP_COLOR_STOPS,
	});
}

const PRECIPITATION_LAYER_OPTIONS = {
	id: "maptiler-precipitation-layer",
	opacity: 1,       // Full opacity – alpha styres via ColorRamp
	smooth: false,
};

const ANIMATION_SPEED_FACTOR = 3600;

export function usePrecipitationLayer(map, isActive, onTimeUpdate) {
	const layerRef = useRef(null);
	const isPlayingRef = useRef(false);

	/* =========================
		OPPRETT LAYER
	========================= */
	const createPrecipitationLayer = useCallback(() => {
		return new PrecipitationLayer({
			...PRECIPITATION_LAYER_OPTIONS,
			colorramp: buildYrPrecipColorRamp(),
		});
	}, []);

	/* =========================
		LEGG TIL PÅ KART
	========================= */
	const addLayerToMap = useCallback(async (precipLayer) => {
		try {
			const beforeLayer = map.getLayer(INSERT_BEFORE_LAYER)
				? INSERT_BEFORE_LAYER
				: undefined;

			map.addLayer(precipLayer, beforeLayer);

			await precipLayer.onSourceReadyAsync();

			const startMs = +precipLayer.getAnimationStartDate();
			const endMs = +precipLayer.getAnimationEndDate();
			const currentMs = +precipLayer.getAnimationTimeDate();

			onTimeUpdate?.({
				type: "ready",
				startMs,
				endMs,
				currentMs,
				isPlaying: false,
			});

		} catch (error) {
			console.error("[usePrecipitationLayer] Kunne ikke legge til nedbørlag:", error);
		}
	}, [map, onTimeUpdate]);

	/* =========================
		FJERN FRA KART
	========================= */
	const removeLayerFromMap = useCallback(() => {
		const layer = layerRef.current;
		if (!layer) return;

		try {
			layer.animateByFactor(0);
			isPlayingRef.current = false;

			if (map.getLayer(PRECIPITATION_LAYER_OPTIONS.id)) {
				map.removeLayer(PRECIPITATION_LAYER_OPTIONS.id);
			}
		} catch (error) {
			console.warn("[usePrecipitationLayer] Feil ved fjerning av lag:", error);
		}

		layerRef.current = null;
	}, [map]);

	/* =========================
		COMMANDS
	========================= */
	const play = useCallback(() => {
		const layer = layerRef.current;
		if (!layer) return;

		layer.animateByFactor(ANIMATION_SPEED_FACTOR);
		isPlayingRef.current = true;
	}, []);

	const pause = useCallback(() => {
		const layer = layerRef.current;
		if (!layer) return;

		layer.animateByFactor(0);
		isPlayingRef.current = false;
	}, []);

	const seekTo = useCallback((timestampMs) => {
		const layer = layerRef.current;
		if (!layer) return;

		layer.setAnimationTime(timestampMs / 1000);
	}, []);

	/* =========================
		EFFECT
	========================= */
	const onActiveChangedToggleLayer = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

		if (isActive && !layerRef.current) {
			const precipLayer = createPrecipitationLayer();
			layerRef.current = precipLayer;

			precipLayer.on("tick", () => {
				const currentMs = +precipLayer.getAnimationTimeDate();
				onTimeUpdate?.({
					type: "tick",
					currentMs,
					isPlaying: isPlayingRef.current,
				});
			});

			precipLayer.on("animationTimeSet", () => {
				const currentMs = +precipLayer.getAnimationTimeDate();
				onTimeUpdate?.({
					type: "seek",
					currentMs,
					isPlaying: isPlayingRef.current,
				});
			});

			addLayerToMap(precipLayer);
		}

		if (!isActive && layerRef.current) {
			removeLayerFromMap();

			onTimeUpdate?.({
				type: "removed",
				startMs: 0,
				endMs: 0,
				currentMs: 0,
				isPlaying: false,
			});
		}

		return () => {
			if (layerRef.current) {
				removeLayerFromMap();
			}
		};
	}, [map, isActive, createPrecipitationLayer, addLayerToMap, removeLayerFromMap, onTimeUpdate]);

	/* =========================
		EFFECT BINDING
	========================= */
	useEffect(onActiveChangedToggleLayer, [onActiveChangedToggleLayer]);

	/* =========================
		RETURN CONTROLS
	========================= */
	return {
		play,
		pause,
		seekTo,
	};
}