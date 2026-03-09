// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";

export default function useMapPageViewModel(
    mapTilerRepository,
    searchLocationUseCase,
    getMapWeatherUseCase,
    activeLocation,
    onLocationChange,
    onResetToDeviceLocation
) {
    const DEBOUNCE_DELAY_MS = 500;

    // Standardverdier for kartet
    const DEFAULT_MAP_VIEW = {
        bbox: null,
        zoom: MAP_ZOOM_LEVELS.DEFAULT,
        lat: activeLocation.lat, // Bruk activeLocation som fallback i stedet for null
        lon: activeLocation.lon
    };

    // =========================
    // STATE
    // =========================
    const [mapView, setMapView] = useState(DEFAULT_MAP_VIEW);
    const [bboxToFit, setBboxToFit] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // =========================
    // SSOT SYNKRONISERING
    // =========================
    // Denne sørger for at kartet flytter seg hvis lokasjonen endres globalt (f.eks. via søk i Header)
    useEffect(() => {
        if (activeLocation.lat && activeLocation.lon) {
            setMapView(prev => ({
                ...prev,
                lat: activeLocation.lat,
                lon: activeLocation.lon
            }));
            // Vi nullstiller ikke bboxToFit her for å unngå uønskede hopp ved små GPS-oppdateringer
        }
    }, [activeLocation.lat, activeLocation.lon]);

    // =========================
    // SEARCH VIEWMODEL
    // =========================
    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        onLocationChange,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        onResetToDeviceLocation
    );

    // =========================
    // MAP CONFIG
    // =========================
    const { apiKey, style } = useMemo(() => {
        return mapTilerRepository.getMapConfig();
    }, [mapTilerRepository]);

    const tz = activeLocation.timezone;

    // =========================
    // MAP CHANGE HANDLER
    // =========================
    const onMapChange = useCallback((lat, lon, bbox, currentZoom, points) => {
        // Vi nullstiller bboxToFit når brukeren manuelt panorerer/zoomer
        setBboxToFit(null);
        setMapPoints(points || []);

        setMapView({
            bbox,
            zoom: currentZoom,
            lat,
            lon
        });
    }, []);

    // =========================
    // WEATHER FETCH LOGIKK
    // =========================
    useEffect(() => {
        if (!mapPoints || mapPoints.length === 0 || !tz) {
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            if (cancelled) return;

            setIsLoading(true);
            try {
                const results = await getMapWeatherUseCase.execute(mapPoints, tz);
                if (!cancelled) {
                    setWeatherPoints(results || []);
                }
            } catch (error) {
                console.error("[VM] Værhenting feilet:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }, DEBOUNCE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mapPoints, tz, getMapWeatherUseCase]);

    // =========================
    // MAP CENTER RESOLUTION
    // =========================
    const mapCenter = {
        lat: mapView.lat ?? activeLocation.lat,
        lon: mapView.lon ?? activeLocation.lon
    };

    // =========================
    // HANDLERS
    // =========================

    const handleSuggestionSelected = (selected) => {
        // 1. Tøm gamle ikoner umiddelbart for å unngå visuell "støy" under flytting
        setWeatherPoints([]);
        
        // 2. Oppdater global SSOT
        onLocationChange(selected);

        // 3. Beregn nytt utsnitt
        const { zoom, bbox } = calculateMapView(selected);
        
        // 4. Oppdater lokal state som trigger kart-flytting
        setBboxToFit(bbox);
        setMapView({
            bbox: bbox,
            zoom: zoom,
            lat: selected.lat,
            lon: selected.lon
        });

        // 5. Tøm søkeforslag
        searchViewModel.onSuggestionSelected(selected);
    };

    const handleResetToDeviceLocation = () => {
        // 1. Tøm værikoner
        setWeatherPoints([]);
        
        // 2. Tving kartet til å slutte å bruke bbox
        setBboxToFit(null);

        // 3. Trigger global reset (manualLocation = null i App.jsx)
        onResetToDeviceLocation();

        // 4. Oppdater lokal kart-state til standard (GPS)
        // Her bruker vi koordinatene fra props direkte for å sikre øyeblikkelig flytting
        setMapView({
            bbox: null,
            zoom: MAP_ZOOM_LEVELS.DEFAULT,
            lat: activeLocation.lat,
            lon: activeLocation.lon
        });

        // 5. Tøm søkefelt
        searchViewModel.onResetLocation();
    };

    return {
        apiKey,
        style,
        zoom: mapView.zoom,
        bboxToFit,
        location: activeLocation,
        mapCenter,
        weatherPoints,
        isLoading,
        onMapChange,

        // Søke-grensesnitt
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: handleSuggestionSelected,
        onResetToDeviceLocation: handleResetToDeviceLocation
    };
}