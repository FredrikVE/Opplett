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
    const [dailyPeriods, setDailyPeriods] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
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
    }, [location.lat, location.lon, geocodingRepository]);


    // Last forecast / alerts / sunrise
    useEffect(() => {
        if (!location.lat || !location.lon) return;

        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);

                const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

                const [forecastData, dailyPeriodForecast, alertResults ] = await Promise.all([
                    forecastRepository.getHourlyForecastGroupedByDate(location.lat, location.lon, hoursAhead, tz),
					forecastRepository.getDailyPeriodForecast(location.lat, location.lon, hoursAhead, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

                const dateLabels = Object.keys(forecastData);
                const sunMap = await sunriseRepository.getSunTimesForDateLabels(location.lat, location.lon, dateLabels, tz);

                if (cancelled) {
					return;
				}

                setForecast(forecastData);
                setDailyPeriods(dailyPeriodForecast);
                setSunTimesByDate(sunMap);
                setAlerts(alertResults?.alerts ?? []);
                setError(null);
            } 
			catch (error) {
                if (!cancelled) {
                    setError(error?.message ?? "Ukjent feil");
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
        dailyPeriods,
        sunTimesByDate,
        alerts,
        loading,
        error,
        location,
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
    };
}
