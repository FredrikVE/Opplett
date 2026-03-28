//src/ui/view/components/MapPage/MapHooks/usePressureLayer.js
import { useEffect, useRef, useCallback } from "react";
import { PressureLayer } from "@maptiler/weather";

const INSERT_BEFORE_LAYER = "Place labels";
const ANIMATION_SPEED_FACTOR = 3600;

const PRESSURE_LAYER_OPTIONS = {
	id: "maptiler-pressure-layer",
	opacity: 0.8,
};

export function usePressureLayer(map, isActive, onTimeUpdate) {
	const layerRef = useRef(null);
	const isPlayingRef = useRef(false);

	/* =========================
		CREATE
	========================= */
	const createLayer = useCallback(() => {
		return new PressureLayer(PRESSURE_LAYER_OPTIONS);
	}, []);

	/* =========================
		ADD
	========================= */
	const addLayerToMap = useCallback(async (layer) => {
		try {
			const beforeLayer = map.getLayer(INSERT_BEFORE_LAYER)
				? INSERT_BEFORE_LAYER
				: undefined;

			map.addLayer(layer, beforeLayer);

			await layer.onSourceReadyAsync();

			const startMs = +layer.getAnimationStartDate();
			const endMs = +layer.getAnimationEndDate();
			const currentMs = +layer.getAnimationTimeDate();

			onTimeUpdate?.({
				type: "ready",
				startMs,
				endMs,
				currentMs,
				isPlaying: false,
			});

		} catch (err) {
			console.error("[PressureLayer] add failed:", err);
		}
	}, [map, onTimeUpdate]);

	/* =========================
		REMOVE
	========================= */
	const removeLayer = useCallback(() => {
		const layer = layerRef.current;
		if (!layer) return;

		try {
			layer.animateByFactor(0);
			isPlayingRef.current = false;

			if (map.getLayer(PRESSURE_LAYER_OPTIONS.id)) {
				map.removeLayer(PRESSURE_LAYER_OPTIONS.id);
			}
		} catch (err) {
			console.warn("[PressureLayer] remove failed:", err);
		}

		layerRef.current = null;
	}, [map]);

	/* =========================
		CONTROLS
	========================= */
	const play = useCallback(() => {
		layerRef.current?.animateByFactor(ANIMATION_SPEED_FACTOR);
		isPlayingRef.current = true;
	}, []);

	const pause = useCallback(() => {
		layerRef.current?.animateByFactor(0);
		isPlayingRef.current = false;
	}, []);

	const seekTo = useCallback((timestampMs) => {
		layerRef.current?.setAnimationTime(timestampMs / 1000);
	}, []);

	/* =========================
		TOGGLE
	========================= */
	const onActiveChanged = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

		if (isActive && !layerRef.current) {
			const layer = createLayer();
			layerRef.current = layer;

			layer.on("tick", () => {
				onTimeUpdate?.({
					type: "tick",
					currentMs: +layer.getAnimationTimeDate(),
					isPlaying: isPlayingRef.current,
				});
			});

			layer.on("animationTimeSet", () => {
				onTimeUpdate?.({
					type: "seek",
					currentMs: +layer.getAnimationTimeDate(),
					isPlaying: isPlayingRef.current,
				});
			});

			addLayerToMap(layer);
		}

		if (!isActive && layerRef.current) {
			removeLayer();

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
				removeLayer();
			}
		};
	}, 
	[map, isActive, createLayer, addLayerToMap, removeLayer, onTimeUpdate]);

	useEffect(onActiveChanged, [onActiveChanged]);

	return { play, pause, seekTo };
}