// src/ui/viewmodels/useHomeScreenViewModel.js
import { useEffect, useState, useRef, useMemo } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {
	const DATA_FETCH_STABILIZATION_MS = 50;

	const initialLocation = { lat: initialLat, lon: initialLon, name: null, timezone: null };
	const [location, setLocation] = useState(initialLocation);
	const [prevInitial, setPrevInitial] = useState({ lat: initialLat, lon: initialLon });
	
	const [forecast, setForecast] = useState({});
	const [sunTimesByDate, setSunTimesByDate] = useState({});
	const [dailySummaryByDate, setDailySummaryByDate] = useState({});
	const [currentWeather, setCurrentWeather] = useState(null);
	const [alerts, setAlerts] = useState([]);
	const [alertsByDate, setAlertsByDate] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Oppdater lokasjon når vi får enhetens posisjon
	if (initialLat !== prevInitial.lat || initialLon !== prevInitial.lon) {
		setPrevInitial({ lat: initialLat, lon: initialLon });
		setLocation(prev => ({
			 ...prev, 
			 lat: initialLat, 
			 lon: initialLon 
			}
		));
	}

	const lastFetchedRef = useRef("");
	const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

	//SSOT for tidshåndtering
	//Bruk useMemo for å unngå unødvendig re-evaluering av tidssone
	const tz = useMemo(() => 
		resolveTimezone(location.timezone), 
	[location.timezone]);

	//Henter stedsnavn (Dette må fortsatt være en Effect fordi det er et asynkront nettverkskall)
	useEffect(() => {
		if (!location.lat || !location.lon) {
			return;
		}
		fetchInitialLocationName(setLocation, geocodingRepository, location.lat, location.lon);
	}, 
	[location.lat, location.lon, geocodingRepository]);

	//Hovedeffekt for datalasting (forblir asynkron i useEffect)
	useEffect(() => {
		if (!location.lat || !location.lon) {
			return;
		}

		let cancelled = false;

        //Inkludert tz i fetchKey for SSOT
		async function loadData() {
            
            const fetchKey = `${location.lat},${location.lon},${hoursAhead},${tz}`;
            if (lastFetchedRef.current === fetchKey) {
				return;
			}

			lastFetchedRef.current = fetchKey;

            try {
                setLoading(true);
                
                const [hourlyRaw, current, alertResults] = await Promise.all([
                    forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
                    forecastRepository.getCurrentWeather(location.lat, location.lon, tz),
                    metAlertsRepository.findAlerts(location.lat, location.lon)
                ]);

				if (cancelled) {
					return;
				}

                const initialGrouped = {};
                hourlyRaw.forEach(hour => {
                    const key = hour.dateISO;
                    if (!initialGrouped[key]) {
                        initialGrouped[key] = {
                            label: formatToLocalDateLabel(hour.timeISO, tz),
                            hours: []
                        };
                    }
                    initialGrouped[key].hours.push(hour);
                });

				setForecast(initialGrouped);
				setCurrentWeather(current);
				setAlerts(alertResults?.alerts ?? []);
				setAlertsByDate(alertResults?.alertsByDate ?? {});
				setLoading(false); 

                const [fullDailySummary] = await Promise.all([
                    // Her kan man vurdere om man trenger fullHourlyRaw hvis den er lik hourlyRaw fra Fase 1
                    forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz)
                ]);

                if (cancelled) {
					return;
				}
                //Vi bruker de eksisterende grupperte dataene for å finne datoene
                setDailySummaryByDate(fullDailySummary);

                // ENDRING 4: Dynamisk uthenting av datoer basert på de faktiske værdataene
                const isoDates = Object.keys(initialGrouped); 
                const solarReport = await sunriseRepository.getFullSolarReport(
                    location.lat, 
                    location.lon, 
                    isoDates, 
                    tz, 
                    formatToLocalTime
                );
                
                setSunTimesByDate(solarReport);
            } 
            catch (error) {
                if (!cancelled) {
                    setError(error?.message ?? "Feil ved henting av data");
                    lastFetchedRef.current = "";
                    setLoading(false);
                }
            }
        }

		//Cleanup funksjon
		const timer = setTimeout(loadData, DATA_FETCH_STABILIZATION_MS);
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
        alerts,
        alertsByDate,
        loading,
        error,
        location,

        getLocalHour: (zuluTime) => getLocalHour(zuluTime, tz),
        formatLocalDateTime: (zuluTime) => formatLocalDateTime(zuluTime, tz),
        formatLocalDate: (zuluTime) => formatLocalDate(zuluTime, tz),

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}