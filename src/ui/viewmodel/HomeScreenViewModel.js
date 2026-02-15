// src/ui/viewmodels/useHomeScreenViewModel.js
import { useEffect, useState, useRef, useMemo } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useHomeScreenViewModel(forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead) {

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

		async function loadData() {
			const fetchKey = `${location.lat},${location.lon},${hoursAhead}`;
			if (lastFetchedRef.current === fetchKey) {
				return;
			}

			lastFetchedRef.current = fetchKey;

			try {
				setLoading(true);
				
				//Fase 1 av datahenting, hent kritisk data. La Solarinfo hente etterpå.
				const [hourlyRaw, current, alertResults] = await Promise.all([
					forecastRepository.getHourlyForecast(location.lat, location.lon, 24, tz),
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

				//Fase 2 av datahenting. Hente Timeforcast med solarinfo hente i bakgrunnen.
				const [fullHourlyRaw, fullDailySummary] = await Promise.all([
					forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead, tz),
					forecastRepository.getDailySummary(location.lat, location.lon, hoursAhead, tz)
				]);

				if (cancelled) {
					return;
				}

				const fullGrouped = {};
				fullHourlyRaw.forEach(hour => {

					const key = hour.dateISO;

					if (!fullGrouped[key]) {
						fullGrouped[key] = {
							label: formatToLocalDateLabel(hour.timeISO, tz),
							hours: []
						};
					}
					fullGrouped[key].hours.push(hour);
				});

				setForecast(fullGrouped);
				setDailySummaryByDate(fullDailySummary);

				const isoDates = Object.keys(fullGrouped);
				if (isoDates.length > 0) {

					const firstDate = new Date(isoDates[0]);
					firstDate.setDate(firstDate.getDate() - 1);
					const dayBeforeISO = firstDate.toISOString().split('T')[0];

					const datesToFetch = [dayBeforeISO, ...isoDates];

					//Henter soltider.
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

					if (!cancelled) {
						setSunTimesByDate(formattedSunMap);
					}
				}

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