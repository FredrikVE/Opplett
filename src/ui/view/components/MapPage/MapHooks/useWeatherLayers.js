// src/ui/view/components/MapPage/MapHooks/useWeatherLayers.js
import { useEffect, useRef, useCallback } from "react";
import { WEATHER_LAYER_DEFS } from "./WeatherLayerConfig.js";
import { LAYER_KEYS } from "../MapLayerToggle/MapToggleConfig.js";

const INSERT_BEFORE_LAYER_ID = "Place labels";
const WEATHER_ANIMATION_SPEED = 3600;

//HJelpefunksjoner
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

    //Tidsoppdatering
	const updateOnTimeUpdateRef = useCallback(() => {
		onTimeUpdateRef.current = onTimeUpdate;
	}, [onTimeUpdate]);

	const emitLayerReady = useCallback((entry) => {
		if (!entry) {
			return;
		}

		const startMs = Math.max(
			toMs(entry.layer.getAnimationStartDate()),
			Date.now()
		);

		const endMs = toMs(entry.layer.getAnimationEndDate());
		const currentMs = toMs(entry.layer.getAnimationTimeDate());

		onTimeUpdateRef.current?.({
			type: "ready",
			startMs,
			endMs,
			currentMs,
			isPlaying: isPlayingRef.current,
			colorRamp: entry.colorRamp,
		});
	}, []);

	const emitLayerLoading = useCallback(() => {
		onTimeUpdateRef.current?.({
			type: "loading",
		});
	}, []);

	const emitLayerRemoved = useCallback(() => {
		onTimeUpdateRef.current?.({
			type: "removed",
		});
	}, []);

	const emitLayerTick = useCallback((currentMs) => {
		onTimeUpdateRef.current?.({
			type: "tick",
			currentMs,
			isPlaying: isPlayingRef.current,
		});
	}, []);

	const emitLayerSeek = useCallback((currentMs) => {
		onTimeUpdateRef.current?.({
			type: "seek",
			currentMs,
			isPlaying: isPlayingRef.current,
		});
	}, []);

    //Funksjoner for layer lookup
	const getLayerEntry = useCallback((layerKey) => {
		if (!layerKey) {
			return null;
		}

		return layerEntriesRef.current.get(layerKey) ?? null;
	}, []);

	const getActiveLayerEntry = useCallback(() => {
		return getLayerEntry(activeLayerKeyRef.current);
	}, [getLayerEntry]);

    //Operasjoner for å vises weather layers
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

	const showLayer = useCallback((entry) => {
		if (!map || !entry) {
			return;
		}

		addLayerToMap(entry);
		map.setLayoutProperty(entry.id, "visibility", "visible");
	}, [map, addLayerToMap]);

	const hideLayer = useCallback((entry) => {
		if (!map || !entry) {
			return;
		}

		if (!map.getLayer(entry.id)) {
			return;
		}

		map.setLayoutProperty(entry.id, "visibility", "none");
	}, [map]);

	const startLayerAnimation = useCallback((entry) => {
		if (!entry) {
			return;
		}

		entry.layer.animateByFactor(WEATHER_ANIMATION_SPEED);
		isPlayingRef.current = true;
	}, []);

	const stopLayerAnimation = useCallback((entry) => {
		if (!entry) {
			return;
		}

		entry.layer.animateByFactor(0);
		isPlayingRef.current = false;
	}, []);

	const activateLayer = useCallback((entry) => {
		if (!entry) {
			return;
		}

		showLayer(entry);
		startLayerAnimation(entry);
		emitLayerReady(entry);
	}, [showLayer, startLayerAnimation, emitLayerReady]);

	const deactivateLayer = useCallback((layerKey) => {
		const entry = getLayerEntry(layerKey);

		if (!entry) {
			return;
		}

		stopLayerAnimation(entry);
		hideLayer(entry);
	}, [getLayerEntry, stopLayerAnimation, hideLayer]);


    //Eventfunksjoner for weatherlayers
	const bindLayerEvents = useCallback((entry) => {
		if (!entry || entry.hasBoundEvents) {
			return;
		}

		const handleLayerTick = () => {
			if (activeLayerKeyRef.current !== entry.key) {
				return;
			}

			const currentMs = toMs(entry.layer.getAnimationTimeDate());
			const startMs = toMs(entry.layer.getAnimationStartDate());
			const endMs = toMs(entry.layer.getAnimationEndDate());

			const hasReachedEnd = currentMs >= endMs || currentMs < startMs;

			if (hasReachedEnd) {
				stopLayerAnimation(entry);
				entry.layer.setAnimationTime(toSeconds(endMs));
				emitLayerTick(endMs);
				return;
			}

			emitLayerTick(currentMs);
		};

		const handleAnimationTimeSet = () => {
			if (activeLayerKeyRef.current !== entry.key) {
				return;
			}

			const currentMs = toMs(entry.layer.getAnimationTimeDate());
			emitLayerSeek(currentMs);
		};

		entry.layer.on("tick", handleLayerTick);
		entry.layer.on("animationTimeSet", handleAnimationTimeSet);
		entry.hasBoundEvents = true;
	}, [stopLayerAnimation, emitLayerTick, emitLayerSeek]);


    //Create og prelode funksjoner
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

		let entry = getLayerEntry(layerKey);

		if (!entry) {
			entry = createLayerEntry(layerKey);
		}

		if (!entry) {
			return null;
		}

		addLayerToMap(entry);
		preloadLayer(entry);

		return entry;
	}, [map, getLayerEntry, createLayerEntry, addLayerToMap, preloadLayer]);


    //Playback controllere
	const setPlaybackState = useCallback((shouldPlay) => {
		const entry = getActiveLayerEntry();

		if (!entry?.isReady) {
			return;
		}

		if (shouldPlay) {
			startLayerAnimation(entry);
			return;
		}

		stopLayerAnimation(entry);
	}, [getActiveLayerEntry, startLayerAnimation, stopLayerAnimation]);

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

    //CleanUp av weatherlayer
	const cleanupWeatherLayers = useCallback(() => {
		for (const entry of layerEntriesRef.current.values()) {
			try {
				stopLayerAnimation(entry);

				if (map?.getLayer(entry.id)) {
					map.removeLayer(entry.id);
				}
			} 

            catch (error) {
				console.warn("[useWeatherLayers] cleanup feilet:", error);
			}
		}

		layerEntriesRef.current.clear();
		activeLayerKeyRef.current = null;
		isPlayingRef.current = false;
	}, [map, stopLayerAnimation]);

    //Handlefunksjoner for useEffects
	const preloadWeatherLayersOnMapReady = useCallback(() => {
		if (!map || !map.isStyleLoaded()) {
			return;
		}

		for (const definition of WEATHER_LAYER_DEFS) {
			ensureLayer(definition.key);
		}

		return cleanupWeatherLayers;
	}, [map, ensureLayer, cleanupWeatherLayers]);

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
			emitLayerRemoved();
			return;
		}

		const nextEntry = ensureLayer(nextLayerKey);

		if (!nextEntry) {
			return;
		}

		if (nextEntry.isReady) {
			activateLayer(nextEntry);
			return;
		}

		emitLayerLoading();
	}, [map, activeLayer, deactivateLayer, ensureLayer, activateLayer, emitLayerLoading, emitLayerRemoved]);

    //UseEffects
	useEffect(updateOnTimeUpdateRef, [updateOnTimeUpdateRef]);
	useEffect(preloadWeatherLayersOnMapReady, [preloadWeatherLayersOnMapReady]);
	useEffect(onActiveWeatherLayerChanged, [onActiveWeatherLayerChanged]);

	return {
		play,
		pause,
		seekTo,
	};
}