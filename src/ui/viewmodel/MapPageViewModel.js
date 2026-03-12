import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/MapBoundsHelper.js";
import { MAP_CAMERA, LOCATION_TYPES } from "../utils/MapUtils/MapConfig.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEBOUNCE_DELAY_MS = 500;

    // Holder styr på hvilken lokasjon geometrien faktisk tilhører
    const [highlightState, setHighlightState] = useState({
        locationId: null,
        geojson: null
    });

    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchBbox, setSearchBbox] = useState(null);

    /* =========================================================
       HELPERS
    ========================================================= */
    const roundCoord = useCallback((value) => Number(value).toFixed(4), []);

    const buildBboxSignature = useCallback((bbox) => {
        if (!bbox) return "no-bbox";

        // Støtter både:
        // 1) [west, south, east, north]
        // 2) [[west, south], [east, north]]
        if (
            Array.isArray(bbox) &&
            bbox.length === 4 &&
            bbox.every(v => typeof v === "number")
        ) {
            const [west, south, east, north] = bbox;
            return `${roundCoord(west)},${roundCoord(south)}|${roundCoord(east)},${roundCoord(north)}`;
        }

        if (
            Array.isArray(bbox) &&
            bbox.length === 2 &&
            Array.isArray(bbox[0]) &&
            Array.isArray(bbox[1])
        ) {
            const [[west, south], [east, north]] = bbox;
            return `${roundCoord(west)},${roundCoord(south)}|${roundCoord(east)},${roundCoord(north)}`;
        }

        return "invalid-bbox";
    }, [roundCoord]);

    /* =========================================================
       MAP EVENT HANDLERS
    ========================================================= */
    const onMapChange = useCallback((lat, lon, bbox, zoom, points) => {
        console.log(`[MapPageVM] 📥 onMapChange (Punkter: ${points?.length})`);
        setMapPoints(points || []);

        // Når brukeren tar kontroll over kartet, slipper vi søke-bbox
        setSearchBbox(prev => (prev ? null : prev));
    }, []);

    /* =========================================================
       SEARCH HANDLERS
    ========================================================= */
    const handleSuggestionSelected = useCallback((selected) => {
        console.log(`[MapPageVM] 🔍 Valgt: ${selected.name}`);
        setWeatherPoints([]);

        const { bbox } = calculateMapView(selected);
        setSearchBbox(bbox ?? null);

        onLocationChange(selected);
    }, [onLocationChange]);

    const handleResetToDeviceLocation = useCallback(() => {
        setWeatherPoints([]);
        setSearchBbox(null);
        onResetToDeviceLocation();
    }, [onResetToDeviceLocation]);

    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        handleSuggestionSelected,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        handleResetToDeviceLocation
    );

    /* =========================================================
       HIGHLIGHT GEOMETRY (knyttet eksplisitt til aktiv lokasjon)
    ========================================================= */
    useEffect(() => {
        if (!activeLocation?.id) {
            setHighlightState({ locationId: null, geojson: null });
            return;
        }

        let cancelled = false;
        const locationId = activeLocation.id;

        // Kritisk: fjern gammel geometri umiddelbart når lokasjon endres
        setHighlightState({ locationId, geojson: null });

        getLocationGeometryUseCase.execute(locationId)
            .then((geo) => {
                if (!cancelled) {
                    setHighlightState({ locationId, geojson: geo });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setHighlightState({ locationId, geojson: null });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeLocation?.id, getLocationGeometryUseCase]);

    // Bare bruk geometri dersom den faktisk tilhører aktiv lokasjon
    const highlightGeometry = useMemo(() => {
        if (!activeLocation?.id) return null;
        if (highlightState.locationId !== activeLocation.id) return null;
        return highlightState.geojson;
    }, [highlightState, activeLocation?.id]);

    /* =========================================================
       MAP TARGET (SSOT)
    ========================================================= */
    const mapTarget = useMemo(() => {
        const geoBounds = getBoundsFromGeometry(highlightGeometry);
        const { zoom: defaultZoom, bbox: defaultBbox } = calculateMapView(activeLocation);

        // Prioritering:
        // 1. Polygon-geometri
        // 2. Søk-bbox
        // 3. Fallback
        const finalBbox = geoBounds ?? searchBbox ?? defaultBbox;

        const locationId = activeLocation.id || `${activeLocation.lat}-${activeLocation.lon}`;
        const targetMode = geoBounds ? "geo" : (searchBbox ? "search" : "default");

        // Kritisk: ID må reflektere faktisk kamera
        const cameraKey = finalBbox
            ? buildBboxSignature(finalBbox)
            : `${roundCoord(activeLocation.lat)},${roundCoord(activeLocation.lon)},${defaultZoom}`;

        const res = {
            id: `${locationId}-${targetMode}-${cameraKey}`,
            type: finalBbox ? MAP_CAMERA.BOUNDS : MAP_CAMERA.CENTER,
            data: finalBbox ?? {
                lat: activeLocation.lat,
                lon: activeLocation.lon,
                zoom: defaultZoom
            },
            isArea:
                activeLocation.type === LOCATION_TYPES.COUNTRY ||
                activeLocation.type === LOCATION_TYPES.REGION
        };

        console.log(`[MapPageVM] ✅ mapTarget SSOT: ${res.id}`);
        return res;
    }, [
        activeLocation?.id,
        activeLocation?.lat,
        activeLocation?.lon,
        activeLocation?.type,
        highlightGeometry,
        searchBbox,
        buildBboxSignature,
        roundCoord
    ]);

    /* =========================================================
       LOAD DATA
    ========================================================= */
    const mapConfig = useMemo(() => mapTilerRepository.getMapConfig(), [mapTilerRepository]);

    useEffect(() => {
        if (!mapPoints.length || !activeLocation?.timezone) {
            setWeatherPoints([]);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await getMapWeatherUseCase.execute(
                    mapPoints,
                    activeLocation.timezone
                );

                if (!cancelled) {
                    setWeatherPoints(results || []);
                }
            } catch (error) {
                console.error("[MapVM] Vær-feil:", error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mapPoints, activeLocation?.id, activeLocation?.timezone, getMapWeatherUseCase]);

    return {
        apiKey: mapConfig.apiKey,
        style: mapConfig.style,
        location: activeLocation,
        isLoading,
        mapTarget,
        highlightGeometry,
        weatherPoints,
        onMapChange,
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: searchViewModel.onResetLocation
    };
}