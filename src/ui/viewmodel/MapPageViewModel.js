import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapConfig.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEBOUNCE_DELAY_MS = 500;

    // =========================
    // STATE
    // =========================
    const [bboxToFit, setBboxToFit] = useState(null);
    const [highlightGeometry, setHighlightGeometry] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(MAP_ZOOM_LEVELS.DEFAULT);

    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        onLocationChange,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        onResetToDeviceLocation
    );

    const { apiKey, style } = useMemo(() => 
        mapTilerRepository.getMapConfig()
    , 
    [mapTilerRepository]);

    // =========================
    // MAP CHANGE HANDLER (Viktig!)
    // =========================
    const onMapChange = useCallback((lat, lon, bbox, zoom, points) => {
        // Oppdaterer hvilke punkter kartet ser akkurat nå
        setMapPoints(points || []);
        setCurrentZoom(zoom);
        
        // Hvis brukeren beveger kartet manuelt, fjerner vi tvungen bounding box
        setBboxToFit(null);
		
    }, [bboxToFit]);

    // =========================
    // WEATHER FETCH LOGIKK
    // =========================
    useEffect(() => {
        if (!mapPoints.length || !activeLocation.timezone) {
            setWeatherPoints([]);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await getMapWeatherUseCase.execute(mapPoints, activeLocation.timezone);
                if (!cancelled) setWeatherPoints(results || []);
            } 
            
            catch (error) {
                console.error("[VM] Vær-henting feilet:", error);
            } 
            
            finally {
                if (!cancelled) setIsLoading(false);
            }
        }, 
        DEBOUNCE_DELAY_MS);

        return () => { 
            cancelled = true; clearTimeout(timer); 
        };
        
    }, [mapPoints, activeLocation.timezone, getMapWeatherUseCase]);

    // =========================
    // GEOMETRY (HIGHLIGHT)
    // =========================
    useEffect(() => {
        if (!activeLocation?.id) { setHighlightGeometry(null); return; }
        let cancelled = false;
        getLocationGeometryUseCase.execute(activeLocation.id).then(geo => {
            if (!cancelled) setHighlightGeometry(geo);
        }).catch(() => { if (!cancelled) setHighlightGeometry(null); });
        return () => { cancelled = true; };
    }, [activeLocation.id, getLocationGeometryUseCase]);

    // =========================
    // HANDLERS
    // =========================
    const handleSuggestionSelected = (selected) => {
        setWeatherPoints([]);
        const { bbox } = calculateMapView(selected);
        setBboxToFit(bbox); 
        onLocationChange(selected);
        searchViewModel.onSuggestionSelected(selected);
    };

    const handleResetToDeviceLocation = () => {
        setWeatherPoints([]);
        setBboxToFit(null);
        onResetToDeviceLocation();
        searchViewModel.onResetLocation();
    };

    return {
        apiKey,
        style,
        zoom: currentZoom,
        bboxToFit,
        location: activeLocation,
        highlightGeometry,
        mapCenter: { lat: activeLocation.lat, lon: activeLocation.lon },
        weatherPoints,
        isLoading,
        onMapChange,
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: handleSuggestionSelected,
        onResetToDeviceLocation: handleResetToDeviceLocation
    };
}