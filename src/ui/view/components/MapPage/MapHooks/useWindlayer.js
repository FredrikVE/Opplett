//src/ui/view/components/MapPage/MapHooks/useWindlayer.js
import { useEffect, useRef, useCallback } from "react";
import { WindLayer, ColorRamp } from "@maptiler/weather";
import { buildWindColorStops } from "../Windmap/WindScale";
import { WIND_LAYER_OPTIONS } from "../Windmap/WindLayerOptions";

const INSERT_BEFORE_LAYER = "Place labels";
const ANIMATION_SPEED_FACTOR = 3600;

export function useWindLayer(map, isActive, onTimeUpdate) {
	const layerRef = useRef(null);
	const isPlayingRef = useRef(false);

	/* =========================
		CREATE LAYER
	========================= */
	const createWindLayer = useCallback(() => {
		return new WindLayer({
			...WIND_LAYER_OPTIONS,
			colorramp: new ColorRamp({
				stops: buildWindColorStops(),
			}),
		});
	}, []);

	/* =========================
		ADD LAYER
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

		} catch (error) {
			console.error("[useWindLayer] addLayer feilet:", error);
		}
	}, [map, onTimeUpdate]);

	/* =========================
		REMOVE
	========================= */
	const removeLayerFromMap = useCallback(() => {
		const layer = layerRef.current;
		if (!layer) return;

		try {
			layer.animateByFactor(0);
			isPlayingRef.current = false;

			if (map.getLayer(WIND_LAYER_OPTIONS.id)) {
				map.removeLayer(WIND_LAYER_OPTIONS.id);
			}
		} catch (error) {
			console.warn("[useWindLayer] remove feilet:", error);
		}

		layerRef.current = null;
	}, [map]);

	/* =========================
		CONTROLS
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
		TOGGLE
	========================= */
	const onActiveChangedToggleLayer = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

		if (isActive && !layerRef.current) {
			const layer = createWindLayer();
			layerRef.current = layer;

			layer.on("tick", () => {
				const currentMs = +layer.getAnimationTimeDate();

				onTimeUpdate?.({
					type: "tick",
					currentMs,
					isPlaying: isPlayingRef.current,
				});
			});

			layer.on("animationTimeSet", () => {
				const currentMs = +layer.getAnimationTimeDate();

				onTimeUpdate?.({
					type: "seek",
					currentMs,
					isPlaying: isPlayingRef.current,
				});
			});

			addLayerToMap(layer);
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
	}, [
		map,
		isActive,
		createWindLayer,
		addLayerToMap,
		removeLayerFromMap,
		onTimeUpdate,
	]);

	useEffect(onActiveChangedToggleLayer, [onActiveChangedToggleLayer]);

	return {
		play,
		pause,
		seekTo,
	};
}