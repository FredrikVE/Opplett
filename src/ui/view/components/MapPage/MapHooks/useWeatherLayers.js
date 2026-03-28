// src/ui/view/components/MapPage/MapHooks/useWeatherLayers.js
import { useEffect, useRef, useCallback } from "react";
import { WEATHER_LAYER_DEFS } from "./WeatherLayerConfig.js";
import { LAYER_KEYS } from "../MapLayerToggle/MapToggleConfig.js";

const INSERT_BEFORE_LAYER_ID = "Place labels";
const WEATHER_ANIMATION_SPEED = 3600;

function getWeatherLayerDefinition(layerKey) {
	return WEATHER_LAYER_DEFS.find((definition) => definition.key === layerKey) ?? null;
}

function isWeatherLayerSelected(activeLayer) {
	return Boolean(activeLayer && activeLayer !== LAYER_KEYS.NONE);
}

function getInsertBeforeLayerId(map) {
	return map.getLayer(INSERT_BEFORE_LAYER_ID)
		? INSERT_BEFORE_LAYER_ID
		: undefined;
}

function toMs(value) {
	return +value;
}

function toSeconds(timestampMs) {
	return timestampMs / 1000;
}

export function useWeatherLayers(map, activeLayer, onTimeUpdate) {

	const layerEntriesRef = useRef(new Map());
	const activeLayerKeyRef = useRef(null);
	const isPlayingRef = useRef(false);
	const onTimeUpdateRef = useRef(onTimeUpdate);

	const updateOnTimeUpdateRef = useCallback(() => {
		onTimeUpdateRef.current = onTimeUpdate;
	}, [onTimeUpdate]);

	const emitLayerReady = useCallback((layer, colorRamp) => {
		const startMs = Math.max(toMs(layer.getAnimationStartDate()), Date.now());
		const endMs = toMs(layer.getAnimationEndDate());
		const currentMs = toMs(layer.getAnimationTimeDate());

		onTimeUpdateRef.current?.({
			type: "ready",
			startMs,
			endMs,
			currentMs,
			isPlaying: isPlayingRef.current,
			colorRamp,
		});
	}, []);

	const emitLayerRemoved = useCallback(() => {
		onTimeUpdateRef.current?.({
			type: "removed",
			startMs: 0,
			endMs: 0,
			currentMs: 0,
			isPlaying: false,
		});
	}, []);

	const addLayerToMap = useCallback((entry) => {
		if (!map || !entry) {
			return;
		}

		if (map.getLayer(entry.id)) {
			return;
		}

		map.addLayer(entry.layer, getInsertBeforeLayerId(map));
		map.setLayoutProperty(entry.id, "visibility", "none");
	}, [map]);

	const activateLayer = useCallback((entry) => {
		if (!map || !entry) {
			return;
		}

		addLayerToMap(entry);

		map.setLayoutProperty(entry.id, "visibility", "visible");
		entry.layer.animateByFactor(WEATHER_ANIMATION_SPEED);
		isPlayingRef.current = true;

		emitLayerReady(entry.layer, entry.colorRamp);
	}, [map, addLayerToMap, emitLayerReady]);

	const deactivateLayer = useCallback((layerKey) => {
		if (!map || !layerKey) {
			return;
		}

		const entry = layerEntriesRef.current.get(layerKey);

		if (!entry) {
			return;
		}

		if (!map.getLayer(entry.id)) {
			return;
		}

		entry.layer.animateByFactor(0);
		map.setLayoutProperty(entry.id, "visibility", "none");
	}, [map]);

	const bindLayerEvents = useCallback((entry) => {
		if (!entry || entry.hasBoundEvents) {
			return;
		}

		const { layer, key } = entry;

		layer.on("tick", () => {
			if (activeLayerKeyRef.current !== key) {
				return;
			}

			const currentMs = toMs(layer.getAnimationTimeDate());
			const startMs = toMs(layer.getAnimationStartDate());
			const endMs = toMs(layer.getAnimationEndDate());
			const hasReachedEnd = currentMs >= endMs || currentMs < startMs;

			if (hasReachedEnd) {
				layer.animateByFactor(0);
				layer.setAnimationTime(toSeconds(endMs));
				isPlayingRef.current = false;

				onTimeUpdateRef.current?.({
					type: "tick",
					currentMs: endMs,
					isPlaying: false,
				});
				return;
			}

			onTimeUpdateRef.current?.({
				type: "tick",
				currentMs,
				isPlaying: isPlayingRef.current,
			});
		});

		layer.on("animationTimeSet", () => {
			if (activeLayerKeyRef.current !== key) {
				return;
			}

			onTimeUpdateRef.current?.({
				type: "seek",
				currentMs: toMs(layer.getAnimationTimeDate()),
				isPlaying: isPlayingRef.current,
			});
		});

		entry.hasBoundEvents = true;
	}, []);

	const createLayerEntry = useCallback((layerKey) => {
		const definition = getWeatherLayerDefinition(layerKey);

		if (!definition) {
			return null;
		}

		const entry = {
			key: definition.key,
			id: definition.id,
			layer: definition.create(),
			isReady: false,
			isPreloading: false,
			hasBoundEvents: false,
			colorRamp: null,
		};

		bindLayerEvents(entry);
		layerEntriesRef.current.set(layerKey, entry);

		return entry;
	}, [bindLayerEvents]);

	const preloadLayer = useCallback((entry) => {
		if (!entry || entry.isReady || entry.isPreloading) {
			return;
		}

		entry.isPreloading = true;

		entry.layer
			.onSourceReadyAsync()
			.then(() => {
				entry.isReady = true;
				entry.colorRamp = entry.layer.getColorRamp();

				if (activeLayerKeyRef.current === entry.key) {
					activateLayer(entry);
				}
			})
			.catch((error) => {
				console.warn(
					`[useWeatherLayers] sourceReady feilet for ${entry.key}:`,
					error
				);
			});
	}, [activateLayer]);

	const ensureLayer = useCallback((layerKey) => {
		if (!map) {
			return null;
		}

		let entry = layerEntriesRef.current.get(layerKey);

		if (!entry) {
			entry = createLayerEntry(layerKey);
		}

		if (!entry) {
			return null;
		}

		addLayerToMap(entry);
		preloadLayer(entry);

		return entry;
	}, [map, createLayerEntry, addLayerToMap, preloadLayer]);

	const getActiveLayerEntry = useCallback(() => {
		const activeLayerKey = activeLayerKeyRef.current;

		if (!activeLayerKey) {
			return null;
		}

		return layerEntriesRef.current.get(activeLayerKey) ?? null;
	}, []);

	const setPlaybackState = useCallback((shouldPlay) => {
		const entry = getActiveLayerEntry();

		if (!entry?.isReady) {
			return;
		}

		entry.layer.animateByFactor(
			shouldPlay ? WEATHER_ANIMATION_SPEED : 0
		);

		isPlayingRef.current = shouldPlay;
	}, [getActiveLayerEntry]);

	const play = useCallback(() => {
		setPlaybackState(true);
	}, [setPlaybackState]);

	const pause = useCallback(() => {
		setPlaybackState(false);
	}, [setPlaybackState]);

	const seekTo = useCallback((timestampMs) => {
		const entry = getActiveLayerEntry();

		if (!entry?.isReady) {
			return;
		}

		entry.layer.setAnimationTime(toSeconds(timestampMs));
	}, [getActiveLayerEntry]);

	const preloadWeatherLayersOnMapReady = useCallback(() => {
		if (!map || !map.isStyleLoaded()) {
			return;
		}

		for (const definition of WEATHER_LAYER_DEFS) {
			ensureLayer(definition.key);
		}

		return () => {
			for (const entry of layerEntriesRef.current.values()) {
				try {
					entry.layer.animateByFactor(0);

					if (map.getLayer(entry.id)) {
						map.removeLayer(entry.id);
					}
				} catch (error) {
					console.warn("[useWeatherLayers] cleanup feilet:", error);
				}
			}

			layerEntriesRef.current.clear();
			activeLayerKeyRef.current = null;
			isPlayingRef.current = false;
		};
	}, [map, ensureLayer]);

	const onActiveWeatherLayerChanged = useCallback(() => {
		if (!map) {
			return;
		}

		const previousLayerKey = activeLayerKeyRef.current;
		const nextLayerKey = isWeatherLayerSelected(activeLayer)
			? activeLayer
			: null;

		if (previousLayerKey === nextLayerKey) {
			return;
		}

		if (previousLayerKey) {
			deactivateLayer(previousLayerKey);
		}

		activeLayerKeyRef.current = nextLayerKey;

		if (!nextLayerKey) {
			isPlayingRef.current = false;
			emitLayerRemoved();
			return;
		}

		const nextEntry = ensureLayer(nextLayerKey);

		if (nextEntry?.isReady) {
			activateLayer(nextEntry);
		}
	}, [map, activeLayer, deactivateLayer, emitLayerRemoved, ensureLayer, activateLayer]);

	useEffect(updateOnTimeUpdateRef, [updateOnTimeUpdateRef]);
	useEffect(preloadWeatherLayersOnMapReady, [preloadWeatherLayersOnMapReady]);
	useEffect(onActiveWeatherLayerChanged, [onActiveWeatherLayerChanged]);

	return {
		play,
		pause,
		seekTo,
	};
}