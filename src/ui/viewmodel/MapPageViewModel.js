// src/ui/viewmodel/MapPageViewModel.js
//
// Ansvar: Kartstatus, geometri-highlight, værpunkter og kartlag.
// Søk er løftet opp til App.jsx – denne mottar kun lokasjonsdata.

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";
import { LAYER_KEYS } from "../view/components/MapPage/MapLayerToggle/MapToggleConfig.js";

/* =========================
    CONSTANTS
========================= */
const IDLE_HIGHLIGHT = { status: "idle", locationId: null, geojson: null };
const DEBOUNCE_DELAY_MS = 500;

export default function useMapPageViewModel(mapTilerRepository, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, deviceCoords, onResetToDeviceLocation) {

    const locationId = activeLocation?.id;
    const locationType = activeLocation?.type;
    const timezone = activeLocation?.timezone;

    const [highlightState, setHighlightState] = useState(IDLE_HIGHLIGHT);
    const [mapPoints, setMapPoints] = useState([]);
    const [viewportBounds, setViewportBounds] = useState(null);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(null);

    //Kartlag-state
    const [activeLayer, setActiveLayer] = useState(LAYER_KEYS.NONE);
    const [showMarkersWithLayer, setShowMarkersWithLayer] = useState(true);

    //Teller som tvinger nytt mapTarget selv når lokasjonen er uendret
    const [resetCounter, setResetCounter] = useState(0);

    const highlightConfirmedRef = useRef(false);
    const previousMapTargetRef = useRef(null);
    const mapStyle = mapTilerRepository.getMapStyle();


    const clearWeatherPoints = useCallback(() => {
        setWeatherPoints([]);
    }, []);

    const resetHighlightState = useCallback(() => {
        setHighlightState(IDLE_HIGHLIGHT);
    }, []);

    const handleResetToDeviceLocation = useCallback(() => {
        clearWeatherPoints();
        setResetCounter(prev => prev + 1);
        previousMapTargetRef.current = null;
        onResetToDeviceLocation();
    }, [clearWeatherPoints, onResetToDeviceLocation]);

    const resetMapState = useCallback(() => {
        clearWeatherPoints();
        setResetCounter(prev => prev + 1);
        previousMapTargetRef.current = null;
    }, [clearWeatherPoints]);


    const onMapChange = useCallback(({ viewport, points }) => {
        setCurrentZoom(viewport?.zoom ?? null);
        setMapPoints(points || []);

        if (viewport?.bounds) {
            setViewportBounds(viewport.bounds);
        }
    }, []);

    const onLayerChange = useCallback((layerKey) => {
        setActiveLayer(layerKey);
    }, []);

    const onToggleMarkers = useCallback(() => {
        setShowMarkersWithLayer(prev => !prev);
    }, []);

    const loadWeather = useCallback(async (points, timezone) => {
        setIsLoading(true);

        try {
            const results = await getMapWeatherUseCase.execute(points, timezone);
            setWeatherPoints(results || []);
        } 
        catch (error) {
            console.error("[MapVM] Vær-feil:", error);
        } 
        finally {
            setIsLoading(false);
        }
    }, [getMapWeatherUseCase]);


    const highlightGeometry =
        locationId === highlightState.locationId
            ? highlightState.geojson
            : null;

    const geometryBounds = getBoundsFromGeometry(highlightGeometry);

    const countryCode = highlightGeometry
        ? activeLocation?.countryCode ?? null
        : null;

    const mapTarget = useMemo(() => {
        const next = resolveMapCamera({
            location: activeLocation,
            geometryBounds,
        });

        if (!next) return null;

        const prev = previousMapTargetRef.current;
        const sameLocation = prev && activeLocation.id === prev._locationId;

        if (sameLocation && !geometryBounds) {
            return prev;
        }

        const target = {
            ...next,
            id: `${next.id}-reset${resetCounter}`,
            _locationId: activeLocation.id,
        };

        previousMapTargetRef.current = target;
        return target;
    }, [activeLocation, geometryBounds, resetCounter]);

    /* =========================
        EFFECTS – LOCATION
    ========================= */
    const onLocationChangedLoadGeometry = useCallback(() => {
        if (!locationId || !isAreaLocation(locationType)) {
            resetHighlightState();
            return;
        }

        let cancelled = false;

        const run = async () => {
            try {
                const geojson = await getLocationGeometryUseCase.execute(locationId);

                if (!cancelled) {
                    setHighlightState({
                        status: "success",
                        locationId,
                        geojson: geojson ?? null,
                    });
                }
            } 
            catch {
                if (!cancelled) {
                    setHighlightState({
                        status: "error",
                        locationId,
                        geojson: null,
                    });
                }
            }
        };

        setHighlightState({
            status: "loading",
            locationId,
            geojson: null,
        });

        run();

        return () => { cancelled = true; };
    }, [locationId, locationType, getLocationGeometryUseCase, resetHighlightState]);


    const onVisiblePointsChangedFetchWeather = useCallback(() => {
        if (!mapPoints.length || !timezone) {
            setWeatherPoints([]);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(() => {
            if (!cancelled) {
                loadWeather(mapPoints, timezone);
            }
        }, DEBOUNCE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mapPoints, timezone, loadWeather]);

    /* =========================
        EFFECTS – UI / VIEWPORT
    ========================= */
    const onHighlightChangedResetConfirmation = useCallback(() => {
        if (!highlightGeometry) {
            highlightConfirmedRef.current = false;
        }
    }, [highlightGeometry]);

    const onViewportChangedHandleHighlightVisibility = useCallback(() => {
        if (!highlightGeometry || !viewportBounds || !geometryBounds) {
            return;
        }

        const [[geoWest, geoSouth], [geoEast, geoNorth]] = geometryBounds;
        const [[vpWest, vpSouth], [vpEast, vpNorth]] = viewportBounds;

        const highlightOutsideViewport =
            vpEast < geoWest || vpWest > geoEast ||
            vpNorth < geoSouth || vpSouth > geoNorth;

        if (!highlightOutsideViewport) {
            highlightConfirmedRef.current = true;
            return;
        }

        if (highlightConfirmedRef.current) {
            resetHighlightState();
        }
    }, [viewportBounds, highlightGeometry, geometryBounds, resetHighlightState]);

    useEffect(onLocationChangedLoadGeometry, [onLocationChangedLoadGeometry]);
    useEffect(onVisiblePointsChangedFetchWeather, [onVisiblePointsChangedFetchWeather]);
    useEffect(onHighlightChangedResetConfirmation, [onHighlightChangedResetConfirmation]);
    useEffect(onViewportChangedHandleHighlightVisibility, [onViewportChangedHandleHighlightVisibility]);

    return {
        mapStyle,
        mapTarget,
        onMapChange,
        currentZoom,

        activeLocation,
        deviceCoords,
        countryCode,

        highlightGeometry,

        weatherPoints,
        isLoading,

        // Kartlag
        activeLayer,
        onLayerChange,
        showMarkersWithLayer,
        onToggleMarkers,

        // Kart-spesifikke lokasjonshandlere
        onResetToDeviceLocation: handleResetToDeviceLocation,
        resetMapState,
    };
}