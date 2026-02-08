import { useEffect, useState, useRef } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel( forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
    //Statevariabler
    const [location, setLocation] = useState({ lat: null, lon: null, name: null, timezone: null });
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hindrer duplikate API-kall: useRef oppdateres synkront og blokkerer 
    // identiske forespørsler umiddelbart uten å vente på neste render.
    const lastFetchedRef = useRef("");

    //Initialiserer searchViewmodell
    const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);


    // Oppdater koordinater når GPS/initial verdier er klare
    useEffect(() => {
        if (initialLat && initialLon) {
            setLocation((prev) => ({
                ...prev, 
                lat: initialLat, 
                lon: initialLon
            }));
        }
    }, [initialLat, initialLon]);   //dependancy array lytter til endringer i initLat/initLon

    // Hent stedsnavn og tidssone basert på koordinater
    useEffect(() => {
        if (!location.lat || !location.lon) {
            return;
        }

        fetchInitialLocationName(setLocation, geocodingRepository, location.lat, location.lon
        );
    }, 
    [location.lat, location.lon]);

    //UseEffect for datahenting
    useEffect(() => {
        if (!location.lat || !location.lon) {
            return;
        }

        let cancelled = false;

        async function loadData() {
            const currentKey = `${location.lat},${location.lon},${hoursAhead}`;
            
            
            if (lastFetchedRef.current === currentKey) {
                return;                                     // Sjekker om vi allerede har startet henting for disse koordinatene
            }

            lastFetchedRef.current = currentKey;            // Lås døra med en gang (synkront)

            //Debug-logging
            console.log("DEBUG: loadData starter for:", currentKey);

            try {
                setLoading(true);
                const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

                // 1. Hent rådata parallelt
                const [hourlyRaw, dailySummary, alertResults] = await Promise.all([
                    forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

                //Grupper forecast per ISO-dato (særlig for SunRise)
                const groupedForecast = {};
                for (const hour of hourlyRaw) {
                    const key = hour.dateISO;
                    if (!groupedForecast[key]) {
                        groupedForecast[key] = { label: hour.dateLabel, hours: [] };
                    }
                    groupedForecast[key].hours.push(hour);
                }

                //Henter soltider for de unike datoene
                const isoDates = Object.keys(groupedForecast);
                const sunMap = await sunriseRepository.getSunTimesForDates(location.lat, location.lon, isoDates, tz);

                if (cancelled) {
                    return;
                }

                //Bruker settermetoder for å lagre data i statevariablene
                setForecast(groupedForecast);
                setDailySummaryByDate(dailySummary);
                setSunTimesByDate(sunMap);
                setAlerts(alertResults?.alerts ?? []);
                setError(null);

            } 
            
            catch (error) {
                if (!cancelled) {
                    console.error("Feil ved henting av værdata:", error);
                    setError(error?.message ?? "Ukjent feil ved henting av værdata");
                    lastFetchedRef.current = ""; // Åpne for nytt forsøk ved feil
                }
            } 
            
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        // En bitteliten "debounce" (50ms) fjerner støyen fra koordinat-hopping i oppstarten
        const timer = setTimeout(loadData, 50);

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
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon),
    };
}