//src/ui/view/components/MapPage/MapHooks/usePrecipitationLayer.js
import { useEffect, useRef, useCallback } from "react";
import { PrecipitationLayer, ColorRamp } from "@maptiler/weather";
import { buildPrecipColorStops } from "../PrecipitationMap/PrecipitationScale.js";

/**
 * Plasserer PrecipitationLayer under label-lagene slik at by-navn
 * forblir lesbare oppå nedbør-overlayet.
 */
const INSERT_BEFORE_LAYER = "Place labels";

function buildPrecipColorRamp() {
	return new ColorRamp({
		stops: buildPrecipColorStops(),
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
			colorramp: buildPrecipColorRamp(),
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