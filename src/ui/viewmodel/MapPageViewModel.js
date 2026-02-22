import { useEffect, useState, useMemo, useRef } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";
import { getGridPoints } from "../utils/MapForecastUtils/gridCalculator.js";

export default function useMapPageViewModel(getMapConfigUseCase, searchLocationUseCase, getLocationNameUseCase, getCurrentWeatherUseCase, initialLat, initialLon) {

    const baseConfig = useMemo(() => getMapConfigUseCase.execute(), [getMapConfigUseCase]);
    const { defaultZoom, apiKey, style, defaultCenter } = baseConfig;

    const [location, setLocation] = useState({
        lat: initialLat ?? defaultCenter.lat,
        lon: initialLon ?? defaultCenter.lon,
        name: null,
        timezone: null
    });

    const [weatherPoints, setWeatherPoints] = useState([]);
    const weatherCache = useRef({});

    const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);
    
    // Fikset: tz brukes nå i return-objektet
    const tz = useMemo(() => resolveTimezone(location.timezone), [location.timezone]);

    useEffect(() => {
        if (!location.lat || !location.lon) return;

        let cancelled = false;

        async function updateMapWeather() {
            // Simulert utsnitt basert på posisjon
            const bounds = {
                south: location.lat - 2,
                north: location.lat + 2,
                west: location.lon - 3,
                east: location.lon + 3
            };

            // Fikset: Bruker defaultZoom her
            const grid = getGridPoints(bounds, defaultZoom);

            const pointsToFetch = grid.filter(p => !weatherCache.current[`${p.lat},${p.lon}`]);

            if (pointsToFetch.length === 0) {
                if (!cancelled) setWeatherPoints(Object.values(weatherCache.current));
                return;
            }

            try {
                const requests = pointsToFetch.slice(0, 15).map(async (p) => {
                    const data = await getCurrentWeatherUseCase.execute({ lat: p.lat, lon: p.lon });
                    if (data) {
                        weatherCache.current[`${p.lat},${p.lon}`] = { ...data, lat: p.lat, lon: p.lon };
                    }
                });

                await Promise.all(requests);

                if (!cancelled) {
                    setWeatherPoints(Object.values(weatherCache.current));
                }
            } catch (error) {
                console.error("Feil ved henting av rutenett-vær:", error);
            }
        }

        updateMapWeather();
        return () => { cancelled = true; };
        
        // Fikset: Lagt til alle nødvendige avhengigheter
    }, [location.lat, location.lon, getCurrentWeatherUseCase, defaultZoom]); 

    return {
        apiKey,
        style,
        zoom: defaultZoom,
        location,
        timezone: tz,
        mapCenter: { lat: location.lat, lon: location.lon },
        weatherPoints,
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}