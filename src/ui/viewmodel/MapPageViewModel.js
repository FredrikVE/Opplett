// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

function calculateMinDist(zoom) {
    if (zoom <= 3) return 2.5;
    if (zoom <= 5) return 1.2;
    if (zoom <= 7) return 0.5;
    if (zoom <= 9) return 0.15;
    if (zoom <= 11) return 0.04;
    if (zoom <= 13) return 0.01;
    return 0.001;
}

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, initialLat, initialLon, onLocationChange, onResetToDeviceLocation) {

    const INIT_ZOOM = 12;
    const COUNTRY_ZOOM = 3; 
    const DEBOUNCE_DELAY_MS = 500;

    const [mapView, setMapView] = useState({ bbox: null, zoom: INIT_ZOOM });
    const [bboxToFit, setBboxToFit] = useState(null);
    const [location, setLocation] = useState({lat: initialLat, lon: initialLon, name: null, timezone: null, bounds: null, type: null});
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    //Synkronisering under rendering (erstatter useEffect for å unngå cascading renders)
    const [prevProps, setPrevProps] = useState({ lat: initialLat, lon: initialLon });

    if (initialLat !== prevProps.lat || initialLon !== prevProps.lon) {
        setPrevProps({ lat: initialLat, lon: initialLon });
        setLocation(prev => ({
            ...prev,
            lat: initialLat,
            lon: initialLon
        }));

        //Nullstiller bboxToFit slik at kartet flytter seg programmatisk til det nye stedet
        setBboxToFit(null);
    }

    //Initialiserer søk med proximity-støtte
    const searchViewModel = useSearchViewModel(
        searchLocationUseCase, 
        onLocationChange, 
        { lat: initialLat, lon: initialLon }
    );

    //Henter kart-konfigurasjon direkte fra repository
    const { apiKey, style } = useMemo(() => {
        return mapTilerRepository.getMapConfig();
    }, [mapTilerRepository]);

    const tz = useMemo(() => {
        return resolveTimezone(location.timezone);
    }, [location.timezone]);


    //Håndterer endringer i kartet (panorering/zooming).
    const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {
        // Stopper "auto-zoom" med en gang brukeren rører kartet manuelt
        setBboxToFit(null); 

        setLocation(prev => ({
            ...prev,
            lat,
            lon
        }));

        setMapView({
            bbox,
            zoom: currentZoom
        });
    }, []);

    // Henting av værdata basert på nåværende kartutsnitt (med debounce)
    useEffect(() => {
        if (!mapView.bbox) {
            return;
        }

        let cancelled = false;
        const minDist = calculateMinDist(mapView.zoom);

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const points = await getMapWeatherUseCase.execute(
                    mapView.bbox,
                    tz,
                    minDist
                );

                if (!cancelled) {
                    setWeatherPoints(points);
                }
            } 
            
            catch (error) {
                console.error("Feil ved henting av kartvær:", error);
            } 
            
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };

    }, 
    [mapView.bbox, mapView.zoom, tz, getMapWeatherUseCase]);

    return {
        apiKey,
        style,

        zoom: mapView.zoom,
        bboxToFit,

        location,
        mapCenter: { lat: location.lat, lon: location.lon },

        weatherPoints,
        isLoading,
        onMapChange,

        // Search-stafett til View
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,

        onSuggestionSelected: (selected) => {
            // Oppdater global state i App.jsx
            onLocationChange(selected);
            
            // Oppdater lokal søke-state
            searchViewModel.onSuggestionSelected(selected);
            
            // Logikk for utsnitt basert på trefftype
            if (selected.type === "country") {
                setBboxToFit(null);
                setMapView(prev => ({ ...prev, zoom: COUNTRY_ZOOM }));
            } 

            else if (selected.bounds) {
                const bbox = [
                    selected.bounds.southwest.lng,
                    selected.bounds.southwest.lat,
                    selected.bounds.northeast.lng,
                    selected.bounds.northeast.lat
                ];
                setBboxToFit(bbox);
            } 

            else {
                setBboxToFit(null);
                setMapView(prev => ({ ...prev, zoom: INIT_ZOOM }));
            }
        },

        onResetToDeviceLocation: () => {
            setBboxToFit(null);
            setMapView(prev => ({ ...prev, zoom: INIT_ZOOM }));
            
            // Kaller den globale reset-funksjonen i App.jsx
            onResetToDeviceLocation();
            
            searchViewModel.onResetLocation(initialLat, initialLon);
        }
    };
}