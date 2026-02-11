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
        if (initialLat && initialLon) {         // Når vi har start-koordinatene
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

                //Finn dagen før den første datoen for å kunne regne diff på dag 1
                const firstDate = new Date(isoDates[0]);
                firstDate.setDate(firstDate.getDate() - 1);
                const dayBeforeISO = firstDate.toISOString().split('T')[0];

                //Hent soltider for alle dager + gårsdagen (datesToFetch blir nå 11 datoer hvis isoDates er 10)
                const datesToFetch = [dayBeforeISO, ...isoDates];
                const rawSunMap = await sunriseRepository.getSunTimesForDates(location.lat, location.lon, datesToFetch);

                const formattedSunMap = {};
                isoDates.forEach((date, index) => {
                    const currentTimes = rawSunMap[date];
                    const prevDate = (index === 0) ? dayBeforeISO : isoDates[index - 1];
                    const prevTimes = rawSunMap[prevDate];

                    //Bruk repository-metoden for å få ferdig behandlet logikk
                    const change = sunriseRepository.getDayLengthChange(currentTimes, prevTimes);

                    formattedSunMap[date] = {
                        sunrise: formatToLocalTime(currentTimes.sunrise, tz),
                        sunset: formatToLocalTime(currentTimes.sunset, tz),
                        dayLengthDiffText: change.text,    // F.eks. "+2 min"
                        isGettingLonger: change.isLonger   // F.eks. true
                    };
                });
                    
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

    // Henter SSOT-funksjon of tidssone fra utils-mappa
    const currentTimeZone = resolveTimezone(location.timezone);

    return {
        forecast,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        loading,
        error,
        location,

        //SSOT-funksjoner for tid slik at graf blir riktig med tidsone
        getLocalHour: (ts) => getLocalHour(ts, currentTimeZone),
        formatLocalDateTime: (ts) => formatLocalDateTime(ts, currentTimeZone),
        formatLocalDate: (ts) => formatLocalDate(ts, currentTimeZone),

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}
