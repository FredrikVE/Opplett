// src/ui/viewmodels/useHomeScreenViewModel.js
import { useEffect, useState, useRef } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {
    
    const [location, setLocation] = useState({lat: null, lon: null, name: null, timezone: null});
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastFetchedRef = useRef("");
    const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

    useEffect(() => {
        if (initialLat && initialLon) {         // når vi har start-koordinatene
            setLocation(initialLocation => ({   // Callback som oppaterer tom locationstate med enhetspossisjon
                ...initialLocation,             // Kopierer alle eksisterende felter fra forrige state
                lat: initialLat,                // Oppdaterer lat = null til initLat
                lon: initialLon                 // Oppdaterer lon = null til initLon
            }));
        }
    }, [initialLat, initialLon]);               //Definerer dependancy array til å lytte etter endringer i initLat og initLon


    useEffect(() => {
        if (!location.lat || !location.lon) {
            return;
        }

        fetchInitialLocationName(
            setLocation,
            geocodingRepository,
            location.lat,
            location.lon
        );

    }, [location.lat, location.lon]);


    useEffect(() => {
        if (!location.lat || !location.lon) {
            return;
        }

        let cancelled = false;

        async function loadData() {
            const fetchKey = `${location.lat},${location.lon},${hoursAhead}`;
            if (lastFetchedRef.current === fetchKey) return;

            lastFetchedRef.current = fetchKey;

            try {
                setLoading(true);

                //SSOT for å lese tidssone på
                const tz = resolveTimezone(location.timezone);

                const [hourlyRaw, dailySummary, alertResults] =
                    await Promise.all([
                        forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                        forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz),
                        metAlertsRepository.findAlerts(location.lat, location.lon)
                    ]);


                //Grupper timevarsel per dato
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

                //Hent og formater soltider
                const isoDates = Object.keys(groupedForecast);
                const rawSunMap = await sunriseRepository.getSunTimesForDates(location.lat, location.lon, isoDates);

                const formattedSunMap = {};
                for (const [date, times] of Object.entries(rawSunMap)) {
                    formattedSunMap[date] = {
                        sunrise: formatToLocalTime(times.sunrise, tz),
                        sunset: formatToLocalTime(times.sunset, tz)
                    };
                }

                if (cancelled) {
                    return;
                }

                setForecast(groupedForecast);
                setDailySummaryByDate(dailySummary);
                setSunTimesByDate(formattedSunMap);
                setAlerts(alertResults?.alerts ?? []);
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

        //Cleanup-function
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [location.lat, location.lon, hoursAhead]);


    return {
        forecast,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        loading,
        error,
        location,

        //SSOT-tid eskporteres videre
        getLocalHour,
        formatLocalDateTime,
        formatLocalDate,

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}
