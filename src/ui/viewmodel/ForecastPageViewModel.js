// src/ui/viewmodel/ForecastPageViewModel.js

import { useEffect, useState, useRef, useMemo } from "react";
import { fetchInitialLocationName } from "../utils/LocationUtils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(getForecastUseCase, getCurrentWeatherUseCase, geocodingRepository, initialLat, initialLon, hoursAhead) {
	
	//Statevariabler og consts
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

	if (initialLat !== prevInitial.lat || initialLon !== prevInitial.lon) {
		setPrevInitial({ lat: initialLat, lon: initialLon });
		setLocation(prev => ({
			...prev,
			lat: initialLat,
			lon: initialLon
		}));
	}

	const lastFetchedRef = useRef("");
	const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

	//SSOT for tidshåndtering
	//Bruk useMemo for å unngå unødvendig re-evaluering av tidssone
	const tz = useMemo(() =>
		resolveTimezone(location.timezone),
	[location.timezone]);

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
				setError(null);

				const result = await getForecastUseCase.execute({ lat: location.lat, lon: location.lon, hoursAhead, timeZone: tz, formatToLocalTime });

				if (cancelled) {
					return;
				}

				const grouped = {};
				Object.entries(result.hourlyByDate).forEach(([dateISO, data]) => {
					const firstHour = data.hours[0];
					grouped[dateISO] = {
						label: firstHour ? formatToLocalDateLabel(firstHour.timeISO, tz) : "",
						hours: data.hours
					};
				});

				setForecast(grouped);
				setDailySummaryByDate(result.dailySummaryByDate);
				setSunTimesByDate(result.sunTimesByDate);
				setAlerts(result.alerts ?? []);
				setAlertsByDate(result.alertsByDate ?? {});

				const current = await getCurrentWeatherUseCase.execute({ lat: location.lat, lon: location.lon, timeZone: tz });

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

		//Cleanup funksjon
		const timer = setTimeout(loadData, DATA_FETCH_STABILIZATION_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, 
	[location.lat, location.lon, hoursAhead, tz, getForecastUseCase, getCurrentWeatherUseCase]);

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