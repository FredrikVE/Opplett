// src/ui/viewmodel/ForecastPageViewModel.js
import { useEffect, useState, useRef } from "react";
import { formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";

export default function useForecastPageViewModel(getForecastUseCase, getAlertsUseCase, getCurrentWeatherUseCase, getSunTimesUseCase, activeLocation, hoursAhead) {
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

    const lastFetchedRef = useRef("");

    // Eksplisitt tidssone fra vår SSOT
    const tz = activeLocation.timezone;

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

                if (cancelled) return;

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

                // 2. Farevarsler
                const alertsResult = await getAlertsUseCase.execute({
                    lat: activeLocation.lat,
                    lon: activeLocation.lon
                });

                if (!cancelled) {
                    setAlerts(alertsResult.alerts ?? []);
                    setAlertsByDate(alertsResult.alertsByDate ?? {});
                }

                // 3. Soloppgang/nedgang
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

                // 4. Nå-vær
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
    }, [activeLocation.lat, activeLocation.lon, hoursAhead, tz,
        getForecastUseCase, getAlertsUseCase, getSunTimesUseCase, getCurrentWeatherUseCase]);

    return {
        // Data
        forecast,
        currentWeather,
        dailySummaryByDate,
        sunTimesByDate,
        alerts,
        alertsByDate,
        loading,
        error,

        // Lokasjon (bruker activeLocation direkte – enrichment skjer i useActiveLocation)
        location: activeLocation,

        // Tidsformateringsfunksjoner
        getLocalHour: (zuluTime) => getLocalHour(zuluTime, tz),
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, tz),
        formatLocalDate: (zuluTime) => formatLocalDate(zuluTime, tz),
    };
}