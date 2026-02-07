// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {
    // Location state
    const [location, setLocation] = useState({lat: null, lon: null, name: null, timezone: null});

    // Oppdater lat/lon når geolocation er klar
    useEffect(() => {
        if (initialLat && initialLon) {
            setLocation((prev) => ({
                ...prev,
                lat: initialLat,
                lon: initialLon,
            }));
        }
    }, [initialLat, initialLon]);

    // Search
    const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

    // Data state
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [alerts, setAlerts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hent stedsnavn + timezone (KJØRES ÉN GANG per lat/lon)
    useEffect(() => {
        if (!location.lat || !location.lon) return;

        fetchInitialLocationName(
            setLocation,
            geocodingRepository,
            location.lat,
            location.lon
        );
    }, [location.lat, location.lon]);


    // Last forecast / alerts / sunrise
    useEffect(() => {
        if (!location.lat || !location.lon) return;

        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);

                const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

                // Vi henter rådata for timer og det ferdige dagssammendraget parallelt
                const [hourlyRaw, dailySummary, alertResults] = await Promise.all([
                    forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

                // Siden HomePage forventer at 'forecast' er gruppert på dato, gjør vi det her:
                const groupedForecast = {};
                for (const hour of hourlyRaw) {
                    if (!groupedForecast[hour.date]) {
                        groupedForecast[hour.date] = [];
                    }
                    groupedForecast[hour.date].push(hour);
                }

                const dateLabels = Object.keys(groupedForecast);
                const sunMap = await sunriseRepository.getSunTimesForDateLabels(location.lat, location.lon, dateLabels, tz);

                if (cancelled) {
                    return;
                }

                setForecast(groupedForecast);
                setDailySummaryByDate(dailySummary);
                setSunTimesByDate(sunMap);
                setAlerts(alertResults?.alerts ?? []);
                setError(null);
            } 
            catch (err) {
                if (!cancelled) {
                    console.error("Feil ved henting av værdata:", err);
                    setError(err?.message ?? "Ukjent feil ved henting av værdata");
                }
            } 
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [location.lat, location.lon, hoursAhead]);


    // Returnerer data til view
    return {
        forecast,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        loading,
        error,
        location,
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        // HER ER ENDRINGEN: Vi sender funksjonen videre til Viewet
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon),
    };
}