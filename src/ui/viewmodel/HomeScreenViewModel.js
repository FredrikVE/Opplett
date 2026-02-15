// src/ui/viewmodels/useHomeScreenViewModel.js
import { useEffect, useState, useRef } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {
    const [location, setLocation] = useState({ lat: null, lon: null, name: null, timezone: null });
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [currentWeather, setCurrentWeather] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [alertsByDate, setAlertsByDate] = useState({}); //Ny state til Alerts inne i DailyForecastCard
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastFetchedRef = useRef("");
    const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

    // SSOT for tidssone
    const tz = resolveTimezone(location.timezone);

    // Oppdater lokasjon når vi får enhetens posisjon
    useEffect(() => {
        if (initialLat && initialLon) {
            setLocation(prev => ({
                ...prev,
                lat: initialLat,
                lon: initialLon
            }));
        }
    }, [initialLat, initialLon]);

    // Hent stedsnavn basert på koordinater
    useEffect(() => {
        if (!location.lat || !location.lon) return;

        fetchInitialLocationName(
            setLocation,
            geocodingRepository,
            location.lat,
            location.lon
        );
    }, [location.lat, location.lon, geocodingRepository]);

    // Hovedeffekt for datalasting
    useEffect(() => {
        if (!location.lat || !location.lon) return;

        let cancelled = false;

        async function loadData() {
            const fetchKey = `${location.lat},${location.lon},${hoursAhead}`;
            if (lastFetchedRef.current === fetchKey) return;

            lastFetchedRef.current = fetchKey;

            try {
                setLoading(true);
                
                // Hent alle rådata parallelt
                const [hourlyRaw, dailySummary, current, alertResults] = await Promise.all([
                    forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getCurrentWeather(location.lat, location.lon, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

                // 1. Grupper timevarsel per dato
                const groupedForecast = {};
                for (const hour of hourlyRaw) {
                    const key = hour.dateISO;
                    if (!groupedForecast[key]) {
                        groupedForecast[key] = {
                            label: formatToLocalDateLabel(hour.timeISO, tz),
                            hours: []
                        };
                    }
                    groupedForecast[key].hours.push(hour);
                }

                // 2. Hent og formater soltider (inkludert dagen før for differanse-beregning)
                const isoDates = Object.keys(groupedForecast);
                if (isoDates.length > 0) {
                    const firstDate = new Date(isoDates[0]);
                    firstDate.setDate(firstDate.getDate() - 1);
                    const dayBeforeISO = firstDate.toISOString().split('T')[0];

                    const datesToFetch = [dayBeforeISO, ...isoDates];
                    const rawSunMap = await sunriseRepository.getSunTimesForDates(location.lat, location.lon, datesToFetch);

                    const formattedSunMap = {};
                    isoDates.forEach((date, index) => {
                        const currentTimes = rawSunMap[date];
                        const prevDate = (index === 0) ? dayBeforeISO : isoDates[index - 1];
                        const prevTimes = rawSunMap[prevDate];

                        const change = sunriseRepository.getDayLengthChange(currentTimes, prevTimes);

                        formattedSunMap[date] = {
                            sunrise: formatToLocalTime(currentTimes.sunrise, tz),
                            sunset: formatToLocalTime(currentTimes.sunset, tz),
                            dayLengthDiffText: change.text,
                            isGettingLonger: change.isLonger
                        };
                    });

                    if (cancelled) {
                        return;
                    }

                    setSunTimesByDate(formattedSunMap);
                }

                if (cancelled) {
                    return;
                }

                // Oppdater alle states
                setForecast(groupedForecast);
                setDailySummaryByDate(dailySummary);
                setCurrentWeather(current);
                
                // Her settes de nye alert-dataene fra repository
                setAlerts(alertResults?.alerts ?? []);
                setAlertsByDate(alertResults?.alertsByDate ?? {});
                setError(null);

            } 

            catch (error) {
                if (!cancelled) {
                    setError(error?.message ?? "Feil ved henting av data");
                    lastFetchedRef.current = "";
                }
            } 

            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        const timer = setTimeout(loadData, 50);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [location.lat, location.lon, hoursAhead, tz, forecastRepository, sunriseRepository, metAlertsRepository]);

    return {
        forecast,
        currentWeather,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,         // Brukes f.eks. til NowCard/Badge
        alertsByDate,   // Brukes til oppslag i tabell
        loading,
        error,
        location,

        // Tidshåndtering
        getLocalHour: (zuluTime) => getLocalHour(zuluTime, tz),
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, tz),
        formatLocalDate: (zuluTime) => formatLocalDate(zuluTime, tz),

        // Søk-funksjonalitet
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}