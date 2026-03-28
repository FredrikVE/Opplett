import { useEffect, useState, useRef  } from "react";
import { formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(getForecastUseCase, getAlertsUseCase, getCurrentWeatherUseCase, searchLocationUseCase, getLocationNameUseCase, getSunTimesUseCase, activeLocation, hoursAhead, onLocationChange, onResetToDeviceLocation) {
    const DATA_FETCH_STABILIZATION_MS = 50;

    // Lokale stater for værdata
    const [forecast, setForecast] = useState({});
    const [sunTimesByDate, setSunTimesByDate] = useState({});
    const [dailySummaryByDate, setDailySummaryByDate] = useState({});
    const [currentWeather, setCurrentWeather] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [alertsByDate, setAlertsByDate] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Metadata om stedet (navn, bounds osv.) som vi kanskje beriker via reverse geocoding
    const [enrichedLocation, setEnrichedLocation] = useState(activeLocation);

    const lastFetchedRef = useRef("");

    // Synkroniser enrichedLocation når activeLocation endres fra utsiden
    useEffect(() => {
        setEnrichedLocation(activeLocation);
    }, [activeLocation]);

    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        onLocationChange,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        onResetToDeviceLocation
    );

    // Eksplisitt tidssone fra vår SSOT
    const tz = activeLocation.timezone;

    // Reverse geocoding: Berik lokasjonen med navn hvis det mangler (f.eks. ved GPS-start)
    useEffect(() => {
        if (activeLocation.lat == null || activeLocation.lon == null || activeLocation.name !== "Min posisjon") {
            return;
        }

        let cancelled = false;

        async function loadLocationName() {
            try {
                const result = await getLocationNameUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon
                });


                if (!cancelled && result?.name) {
                    setEnrichedLocation(prev => ({
                        ...prev,
                        name: result.name,
                        // Vi beholder tz fra activeLocation da den allerede er beregnet i App.jsx
                        bounds: result.bounds || null,
                        type: result.type || null
                    }));
                }
            } 
			
			catch (error) {
                console.warn("Kunne ikke hente stedsnavn for GPS-posisjon", error);
            }
        }

        loadLocationName();
        return () => { cancelled = true; };
    }, [activeLocation.lat, activeLocation.lon, activeLocation.name, getLocationNameUseCase]);

    // Hovedeffekt for datainnhenting
    useEffect(() => {
        if (activeLocation.lat == null || activeLocation.lon == null || !tz) {
            return;
        }

        let cancelled = false;

        async function loadData() {
            const fetchKey = `${activeLocation.lat},${activeLocation.lon},${hoursAhead},${tz}`;
            if (lastFetchedRef.current === fetchKey) {
				return;
			}

            lastFetchedRef.current = fetchKey;

            try {
                setLoading(true);
                setError(null);

                // 1. Værmelding
                const forecastResult = await getForecastUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon,
                    hoursAhead,
                    timeZone: tz
                });

                if (cancelled) {
					return;
				}

                const grouped = {};
                const entries = Object.entries(forecastResult.hourlyByDate);
                entries.sort((a, b) => a[0].localeCompare(b[0]));

                entries.forEach(([dateISO, data]) => {
                    grouped[dateISO] = {
                        label: formatToLocalDateLabel(dateISO, tz),
                        hours: data.hours
                    };
                });

                setForecast(grouped);
                setDailySummaryByDate(forecastResult.dailySummaryByDate);

                //Farevarsler
                const alertsResult = await getAlertsUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon
                });

                if (!cancelled) {
                    setAlerts(alertsResult.alerts ?? []);
                    setAlertsByDate(alertsResult.alertsByDate ?? {});
                }

                //Soloppgang/nedgang
                const isoDates = Object.keys(grouped);
                const sunTimes = await getSunTimesUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon,
                    isoDates,
                    timeZone: tz,
                    formatToLocalTime
                });

                if (!cancelled) {
					setSunTimesByDate(sunTimes);
				}

                //Nå-vær
                const current = await getCurrentWeatherUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon,
                    timeZone: tz
                });

                if (!cancelled) {
					setCurrentWeather(current);
				}

                setLoading(false);
            } 

			catch (error) {
                if (!cancelled) {
                    setError(error?.message ?? "Feil ved henting av data");
                    lastFetchedRef.current = "";
                    setLoading(false);
                }
            }
        }

        const timer = setTimeout(loadData, DATA_FETCH_STABILIZATION_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, 
	[activeLocation.lat, activeLocation.lon, hoursAhead, tz, getForecastUseCase, getAlertsUseCase, getSunTimesUseCase, getCurrentWeatherUseCase]);

    return {
        forecast,
        currentWeather,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        alertsByDate,
        loading,
        error,
        location: enrichedLocation, // Bruker den berikede lokasjonen for UI

        getLocalHour: (zuluTime) => getLocalHour(zuluTime, tz),
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, tz),
        formatLocalDate: (zuluTime) => formatLocalDate(zuluTime, tz),

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation()
    };
}