// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEBOUNCE_DELAY_MS = 500;

    // =========================
    // STATE
    // =========================
    const [mapView, setMapView] = useState({
        bbox: null,
        zoom: MAP_ZOOM_LEVELS.DEFAULT,
        lat: activeLocation.lat,
        lon: activeLocation.lon
    });
    
    const [bboxToFit, setBboxToFit] = useState(null);
    const [highlightGeometry, setHighlightGeometry] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // =========================
    // SSOT SYNKRONISERING
    // =========================
    // Sørger for at kartet flytter seg når activeLocation endres (f.eks. via søk i andre faner)
    useEffect(() => {
        if (activeLocation.lat && activeLocation.lon) {
            setMapView(prev => ({
                ...prev,
                lat: activeLocation.lat,
                lon: activeLocation.lon
            }));
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
        // Vi nullstiller bboxToFit her så kartet ikke "låses" til forrige søk
        setBboxToFit(null);
        
        // Lagrer punktene som extractCityPoints i kartet har funnet
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
        // Vi trenger punkter og tidssone for å starte
        if (!mapPoints || mapPoints.length === 0 || !tz) {
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            if (cancelled) return;

            setIsLoading(true);
            try {
                // Henter værdata for alle identifiserte punkter i kartutsnittet
                const results = await getMapWeatherUseCase.execute(mapPoints, tz);
                
                if (!cancelled) {
                    setWeatherPoints(results || []);
                }
            } catch (error) {
                console.error("[VM] Feil ved henting av vær for kart:", error);
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
    }, [mapPoints, tz, getMapWeatherUseCase]);

    // =======================================================
    // UseEffect hook for HighlightGeometri på og kartgrenser
    // =======================================================
    useEffect(() => {

        if (!activeLocation?.id) {
            setHighlightGeometry(null);
            return;
        }

        let cancelled = false;

        const loadGeometry = async () => {

            try {

                const geo = await getLocationGeometryUseCase.execute(activeLocation.id);
                console.log("[VM] Highlight geojson:", geo);

                if (!cancelled) {
                    setHighlightGeometry(geo);
                }

            }
            catch (err) {

                console.error("[VM] Klarte ikke hente highlight-geometri:", err);

                if (!cancelled) {
                    setHighlightGeometry(null);
                }
            }
        };

        loadGeometry();

        return () => {
            cancelled = true;
        };

    }, [activeLocation.id, getLocationGeometryUseCase]);

    // =========================
    // HANDLERS
    // =========================

    const handleSuggestionSelected = (selected) => {
        // Tømmer forrige værikoner så de ikke henger igjen på feil plass under flytting
        setWeatherPoints([]);
        setMapPoints([]);     // <-- LEGG TIL DENNE
        
        // Oppdaterer global SSOT i App.jsx
        onLocationChange(selected);

        // Bruker hjelpefunksjonen til å finne korrekt zoom/utsnitt for stedstypen
        const { zoom, bbox } = calculateMapView(selected);
        
        setBboxToFit(bbox);
        setMapView({
            bbox: bbox,
            zoom: zoom,
            lat: selected.lat,
            lon: selected.lon
        });

        searchViewModel.onSuggestionSelected(selected);
    };

    const handleResetToDeviceLocation = () => {
        setWeatherPoints([]);
        setBboxToFit(null);

        // Nullstiller manuelt valg i App.jsx (slik at GPS overtar)
        onResetToDeviceLocation();

        // Tvinger kartet til å flytte seg til de nåværende GPS-koordinatene
        setMapView({
            bbox: null,
            zoom: MAP_ZOOM_LEVELS.DEFAULT,
            lat: activeLocation.lat,
            lon: activeLocation.lon
        });

        searchViewModel.onResetLocation();
    };

    return {
        apiKey,
        style,
        zoom: mapView.zoom,
        bboxToFit,
        location: activeLocation,
        
        //highlight for kartgrenser på landsnivå, kommunenivå og fylkesnivå.
        highlightGeometry,

        mapCenter: {
            lat: mapView.lat ?? activeLocation.lat,
            lon: mapView.lon ?? activeLocation.lon
        },
        weatherPoints,
        isLoading,
        onMapChange,

        // Søke-funksjonalitet
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: handleSuggestionSelected,
        onResetToDeviceLocation: handleResetToDeviceLocation
    };
}