import { useEffect, useState, useRef } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {
    const [location, setLocation] = useState({ lat: null, lon: null, name: null, timezone: null });
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastFetchedRef = useRef("");
    const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    // SSOT for tidsformatering til LocationForecastRepository() og SunriseRepository()           //
    // Her defineres hvordan tid skal se ut i hele appen                                         //
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    const formatToLocalTime = (isoString, tz) => {
        if (!isoString) {
            return "--:--";
        }
        return new Date(isoString).toLocaleTimeString("nb-NO", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const formatToLocalDateLabel = (isoString, tz) => {
        const date = new Date(isoString);
        const label = date.toLocaleDateString("nb-NO", {
            weekday: "long",
            day: "numeric",
            month: "short",
            timeZone: tz
        });
        return label.charAt(0).toUpperCase() + label.slice(1);
    };

    const getTimezone = () => {
        return (
            location.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone ??
            "UTC"
        );
    };

    const formatLocalDate = (timestampMs) => {
        const tz = getTimezone();

        return new Date(timestampMs)
            .toLocaleDateString("nb-NO", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: tz
            });
    };



    const getLocalHour = (timestampMs) => {
        const tz = getTimezone();

        return Number(
            new Date(timestampMs).toLocaleTimeString("nb-NO", {
                timeZone: tz,
                hour: "numeric",
                hour12: false
            })
        );
    };

    const formatLocalDateTime = (timestampMs) => {
        const tz = getTimezone();

        return new Date(timestampMs).toLocaleString("nb-NO", {
            timeZone: tz,
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };


    // UseEffect for å sette startkoordinater fra brukerpossisjon
    useEffect(() => {
        if (initialLat && initialLon) {
            setLocation((prev) => ({
                ...prev,
                lat: initialLat, 
                lon: initialLon 
            }));
        }
    }, [initialLat, initialLon]);   //Dependancy array lytter etter endringer på init-lat/lon


    //UseEffect for å sette stedsnavn fra geo-lokasjon.
    useEffect(() => {
        if (!location.lat || !location.lon) {
            return;
        }

        fetchInitialLocationName(setLocation, geocodingRepository, location.lat, location.lon);
    }, 
    
    [location.lat, location.lon]);


    //UseEffect for å gjøre API-kall ved å laste inn data fra repositories og legge disse inn i statevariabler
    useEffect(() => {

        if (!location.lat || !location.lon) {
            return;
        }

        let cancelled = false;

        async function loadData() {
            const currentKey = `${location.lat},${location.lon},${hoursAhead}`;
            if (lastFetchedRef.current === currentKey) {
                return;
            }
            
            lastFetchedRef.current = currentKey;

            try {
                setLoading(true);

                // Finn tidssone (Fallback til nettleserens tidssone hvis OpenCage ikke har svart ennå)
                const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

                //Henter data fra Repositories
                const [hourlyRaw, dailySummary, alertResults] = await Promise.all([
                    forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

                //Formater og grupper værmelding til Sunrise og Forecast
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

                // 3. Hent og formater soltider
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

                //Bruker UseState sine sette-funksjoner for å oppdatere data-states
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
                if (!cancelled) setLoading(false);
            }
        }

        const timer = setTimeout(loadData, 50);

        //Clean-up-function
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, 
    
    [location.lat, location.lon, hoursAhead]);      //Dependancy array lytter etter endringer på lat/lon og houersAhead (som er konstant)

    return {
        forecast,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        loading,
        error,
        location,

        getLocalHour,
	    formatLocalDateTime,
        formatLocalDate,

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon),
    };
}