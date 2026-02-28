import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

export default function useMapPageViewModel(
    getMapConfigUseCase, 
    searchLocationUseCase, 
    getMapWeatherUseCase, 
    initialLat, 
    initialLon
) {
    const baseConfig = useMemo(() => getMapConfigUseCase.execute(), [getMapConfigUseCase]);
    const { defaultZoom, apiKey, style, defaultCenter } = baseConfig;

    // Lokasjon styres av søkefeltet eller GPS ved oppstart
    const [location, setLocation] = useState({
        lat: initialLat ?? defaultCenter.lat,
        lon: initialLon ?? defaultCenter.lon,
        name: null,
        timezone: null
    });

    // Denne staten holder styr på hva brukeren faktisk ser på kartet
    const [mapView, setMapView] = useState({
        lat: location.lat,
        lon: location.lon,
        bbox: null, // [vest, sør, øst, nord]
        zoom: defaultZoom // Lagrer zoom-nivået her
    });

    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);
    const tz = useMemo(() => resolveTimezone(location.timezone), [location.timezone]);

    /**
     * Callback som WeatherMap kaller på hver 'moveend'.
     * Vi inkluderer nå currentZoom for å styre tettheten av værikoner.
     */
    const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {
        setMapView({ 
            lat, 
            lon, 
            bbox, 
            zoom: currentZoom 
        });
    }, []);

    useEffect(() => {
        const targetLat = mapView.lat || location.lat;
        const targetLon = mapView.lon || location.lon;

        if (!targetLat || !targetLon) return;

        let cancelled = false;

        // DEBOUNCE: Venter 500ms før vi henter data for å unngå API-stress ved panorering.
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Vi sender nå med mapView.zoom til UseCase
                const points = await getMapWeatherUseCase.execute(
                    targetLat, 
                    targetLon, 
                    tz,
                    mapView.bbox,
                    mapView.zoom 
                );

                if (!cancelled) {
                    setWeatherPoints(points);
                }
            } catch (error) {
                console.error("Feil ved oppdatering av kart-vær:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }, 500); 

        return () => { 
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mapView, tz, getMapWeatherUseCase, location.lat, location.lon]); 

    return {
        // Kart-konfigurasjon
        apiKey,
        style,
        zoom: defaultZoom,

        // Vær-punkter og tilstand
        location,
        timezone: tz,
        mapCenter: { lat: location.lat, lon: location.lon },
        weatherPoints,
        isLoading,
        onMapChange,

        // Søke-logikk
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}