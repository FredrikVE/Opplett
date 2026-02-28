// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

export default function useMapPageViewModel(getMapConfigUseCase, searchLocationUseCase, getMapWeatherUseCase, initialLat, initialLon) {
    const INIT_ZOOM = 12;
    // 1. Grunnconfig - Lagt til RETURN og fallback objekt
    const config = useMemo(() => {
        return getMapConfigUseCase.execute() || {};
    }, [getMapConfigUseCase]);

    const { apiKey, style } = config;

    // 2. State for lokasjon (Søk/GPS)
    const [location, setLocation] = useState({
        lat: initialLat,
        lon: initialLon,
        name: null,
        timezone: null
    });

    // 3. State for kartutsnitt
    const [mapView, setMapView] = useState({
        lat: initialLat,
        lon: initialLon,
        bbox: null,
        zoom: INIT_ZOOM 
    });

    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);
    const tz = useMemo(() => resolveTimezone(location.timezone), [location.timezone]);

    //SYNKRONISERING: Oppdaterer staten når GPS-koordinater lander
    useEffect(() => {
        if (initialLat && initialLon) {
            setLocation(prev => ({ ...prev, lat: initialLat, lon: initialLon }));
            setMapView(prev => ({ ...prev, lat: initialLat, lon: initialLon }));
        }
    }, [initialLat, initialLon]);

    // View-logikk: Oversetter zoom til geografisk avstand (minDist)
    const calculateMinDist = useCallback((zoom) => {
        if (zoom <= 5)  return 1.2;
        if (zoom <= 7)  return 0.5;
        if (zoom <= 9)  return 0.15;
        if (zoom <= 11) return 0.04;
        if (zoom <= 13) return 0.01;
        return 0.001;
    }, []);

    const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {
        setMapView({ lat, lon, bbox, zoom: currentZoom });
    }, []);

    // 4. Effekt for datahenting ved bevegelse på kartet
    useEffect(() => {
        if (mapView.lat === null || mapView.lon === null) {
            return;
        }

        let cancelled = false;
        const minDist = calculateMinDist(mapView.zoom);

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const points = await getMapWeatherUseCase.execute(
                    mapView.lat, 
                    mapView.lon, 
                    tz, 
                    mapView.bbox, 
                    minDist // Sender minDist i stedet for zoom
                );
                if (!cancelled) setWeatherPoints(points);
            } 
            
            catch (e) {
                console.error("Feil ved henting av kartvær", e);
            } 
            
            finally {
                if (!cancelled) setIsLoading(false);
            }
        }, 500);

        return () => { 
            cancelled = true; 
            clearTimeout(timer); 
        };
    }, [mapView, tz, getMapWeatherUseCase, calculateMinDist]);

    return {
        apiKey,
        style,
        zoom: mapView.zoom,
        location,
        mapCenter: { lat: location.lat, lon: location.lon },
        weatherPoints,
        isLoading,
        onMapChange,

        // Søkefelt-logikk
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}