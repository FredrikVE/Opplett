//src/ui/view/components/MapPage/MapHooks/useWeatherLayers.js
import { useEffect, useRef, useCallback } from "react";
import { WEATHER_LAYER_DEFS } from "./WeatherLayerConfig.js";
import { LAYER_KEYS } from "../MapLayerToggle/MapToggleConfig.js";

const INSERT_BEFORE_LAYER = "Place labels";
const ANIMATION_SPEED_FACTOR = 3600;

export function useWeatherLayers(map, activeLayer, onTimeUpdate) {

	// Map<layerKey, { layer, id, key, isReady, colorRamp }>
	const layersRef = useRef(new Map());
	const activeKeyRef = useRef(null);
	const isPlayingRef = useRef(false);

	//Stabile refs for callbacks som brukes i event-handlers
    const onTimeUpdateRef = useRef(onTimeUpdate);
    useEffect(() => {
        onTimeUpdateRef.current = onTimeUpdate;
    });

    
	/* =========================
		OPPRETT ENKELT LAG
	========================= */
	const ensureLayer = useCallback((key) => {
		if (!map || layersRef.current.has(key)) {
			return layersRef.current.get(key) ?? null;
		}

		const def = WEATHER_LAYER_DEFS.find(d => d.key === key);
		if (!def) return null;

		const layer = def.create();

		const entry = {
			layer,
			id: def.id,
			key: def.key,
			isReady: false,
			colorRamp: null,
		};
		layersRef.current.set(def.key, entry);

		const beforeLayer = map.getLayer(INSERT_BEFORE_LAYER)
			? INSERT_BEFORE_LAYER
			: undefined;

		map.addLayer(layer, beforeLayer);
		map.setLayoutProperty(def.id, "visibility", "none");

		// Events — bruker ref for stabil tilgang til onTimeUpdate
        layer.on("tick", () => {
            if (activeKeyRef.current !== def.key) return;

            const currentMs = +layer.getAnimationTimeDate();
            const endMs = +layer.getAnimationEndDate();

            if (currentMs >= endMs || currentMs < +layer.getAnimationStartDate()) {
                layer.animateByFactor(0);
                layer.setAnimationTime(endMs / 1000);
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
			if (activeKeyRef.current !== def.key) return;

			onTimeUpdateRef.current?.({
				type: "seek",
				currentMs: +layer.getAnimationTimeDate(),
				isPlaying: isPlayingRef.current,
			});
		});

		// Vent på data
		layer.onSourceReadyAsync().then(() => {
			entry.isReady = true;
			entry.colorRamp = layer.getColorRamp();

			// Hvis dette laget er aktivt og venter på data, start det nå
			if (activeKeyRef.current === def.key) {
				map.setLayoutProperty(entry.id, "visibility", "visible");
				layer.animateByFactor(ANIMATION_SPEED_FACTOR);
				isPlayingRef.current = true;

				//const startMs = +layer.getAnimationStartDate();
                const startMs = Math.max(+layer.getAnimationStartDate(), Date.now());
				const endMs = +layer.getAnimationEndDate();
				const currentMs = +layer.getAnimationTimeDate();

				onTimeUpdateRef.current?.({
					type: "ready",
					startMs,
					endMs,
					currentMs,
					isPlaying: true,
					colorRamp: entry.colorRamp,
				});
			}
		}).catch((err) => {
			console.warn(`[useWeatherLayers] sourceReady feilet for ${def.key}:`, err);
		});

		return entry;
	}, [map]);

	/* =========================
		SHOW / HIDE LAG
	========================= */
	const showLayer = useCallback((key) => {
		const entry = ensureLayer(key);
		if (!entry || !map) return;

		if (entry.isReady) {
			map.setLayoutProperty(entry.id, "visibility", "visible");
			entry.layer.animateByFactor(ANIMATION_SPEED_FACTOR);
			isPlayingRef.current = true;

			const layer = entry.layer;
			//const startMs = +layer.getAnimationStartDate();
            const startMs = Math.max(+layer.getAnimationStartDate(), Date.now());
			const endMs = +layer.getAnimationEndDate();
			const currentMs = +layer.getAnimationTimeDate();

			onTimeUpdateRef.current?.({
				type: "ready",
				startMs,
				endMs,
				currentMs,
				isPlaying: true,
				colorRamp: entry.colorRamp,
			});
		}
		// Hvis ikke ready ennå, vil onSourceReadyAsync-callbacken håndtere det
	}, [map, ensureLayer]);

	const hideLayer = useCallback((key) => {
		const entry = layersRef.current.get(key);
		if (!entry || !map) return;

		entry.layer.animateByFactor(0);
		map.setLayoutProperty(entry.id, "visibility", "none");
	}, [map]);

	/* =========================
		CONTROLS
	========================= */
	const play = useCallback(() => {
		const entry = layersRef.current.get(activeKeyRef.current);
		if (!entry?.isReady) return;

		entry.layer.animateByFactor(ANIMATION_SPEED_FACTOR);
		isPlayingRef.current = true;
	}, []);

	const pause = useCallback(() => {
		const entry = layersRef.current.get(activeKeyRef.current);
		if (!entry?.isReady) return;

		entry.layer.animateByFactor(0);
		isPlayingRef.current = false;
	}, []);

	const seekTo = useCallback((timestampMs) => {
		const entry = layersRef.current.get(activeKeyRef.current);
		if (!entry?.isReady) return;

		entry.layer.setAnimationTime(timestampMs / 1000);
	}, []);

	/* =========================
		EFFECT: PRELOAD VED MAP READY
	========================= */
    useEffect(() => {
        if (!map || !map.isStyleLoaded()) return;

        const layers = layersRef.current;

        for (const def of WEATHER_LAYER_DEFS) {
            ensureLayer(def.key);
        }

        return () => {
            for (const [, entry] of layers) {
                try {
                    entry.layer.animateByFactor(0);
                    if (map.getLayer(entry.id)) {
                        map.removeLayer(entry.id);
                    }
                } catch (err) {
                    console.warn(`[useWeatherLayers] cleanup feilet for ${entry.key}:`, err);
                }
            }
            layers.clear();
            activeKeyRef.current = null;
            isPlayingRef.current = false;
        };
    }, [map, ensureLayer]);

	/* =========================
		EFFECT: TOGGLE VED LAYER-BYTTE
	========================= */
	useEffect(() => {
		if (!map) return;

		const prevKey = activeKeyRef.current;
		const isOverlay = activeLayer && activeLayer !== LAYER_KEYS.NONE;
		const nextKey = isOverlay ? activeLayer : null;

		if (prevKey === nextKey) return;

		if (prevKey) {
			hideLayer(prevKey);
		}

		if (nextKey) {
			activeKeyRef.current = nextKey;
			showLayer(nextKey);
		} else {
			activeKeyRef.current = null;
			isPlayingRef.current = false;

			onTimeUpdateRef.current?.({
				type: "removed",
				startMs: 0,
				endMs: 0,
				currentMs: 0,
				isPlaying: false,
			});
		}
	}, [map, activeLayer, showLayer, hideLayer]);

	return {
		play,
		pause,
		seekTo,
	};
}