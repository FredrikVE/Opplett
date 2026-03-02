// src/ui/viewmodel/ForecastPageViewModel.js
import { useEffect, useState, useRef, useMemo } from "react";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(getForecastUseCase, getAlertsUseCase, getCurrentWeatherUseCase, searchLocationUseCase, getLocationNameUseCase, getSunTimesUseCase, initialLat, initialLon, hoursAhead, onLocationChange, onResetToDeviceLocation, initialTimezone) {

	const DATA_FETCH_STABILIZATION_MS = 50;

	const [location, setLocation] = useState({ lat: initialLat, lon: initialLon, name: null, timezone: initialTimezone, bounds: null, type: null });
	const [forecast, setForecast] = useState({});
	const [sunTimesByDate, setSunTimesByDate] = useState({});
	const [dailySummaryByDate, setDailySummaryByDate] = useState({});
	const [currentWeather, setCurrentWeather] = useState(null);
	const [alerts, setAlerts] = useState([]);
	const [alertsByDate, setAlertsByDate] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	
	// Synkronisering av props (SSOT fra App.jsx)
	const [prevProps, setPrevProps] = useState({ lat: initialLat, lon: initialLon, tz: initialTimezone });

	if (initialLat !== prevProps.lat || initialLon !== prevProps.lon || initialTimezone !== prevProps.tz) {
		setPrevProps({ lat: initialLat, lon: initialLon, tz: initialTimezone });
		setLocation({ 
			lat: initialLat, 
			lon: initialLon, 
			name: null, 
			timezone: initialTimezone, 
			bounds: null, 
			type: null 
		});
	}

	const lastFetchedRef = useRef("");

	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		onLocationChange,
		{ lat: location.lat, lon: location.lon },
		onResetToDeviceLocation
	);

	// Stabil og eksplisitt timezone basert på SSOT
	const tz = useMemo(() => {
		const resolved = resolveTimezone(location.timezone);
		return resolved;
	}, [location.timezone]);

	// Reverse geocoding (for å hente stedsnavn hvis det mangler, f.eks. ved GPS-start)
	useEffect(() => {
		if (!location.lat || !location.lon) {
			return;
		}

		let cancelled = false;

		async function loadLocationName() {
			try {
				const result = await getLocationNameUseCase.execute({
					lat: location.lat,
					lon: location.lon
				});

				if (cancelled || !result?.name) {
					return;
				}

				setLocation(prev => {
					if (prev.name === result.name && prev.timezone === result.timezone) {
						return prev;
					}

					return {
						...prev,
						name: result.name,
						timezone: result.timezone ?? prev.timezone,   // ← FIX
						//timezone: result.timezone,
						bounds: result.bounds || null,
						type: result.type || null
					};
				});
			}

			catch (error) {
				console.warn("Kunne ikke hente stedsnavn fra MapTiler", error);
			}
		}

		loadLocationName();
		
		return () => { 
			cancelled = true; 
		};

	}, 
	[location.lat, location.lon, getLocationNameUseCase]);

	// Hovedeffekt for datainnhenting
	useEffect(() => {
		if (!location.lat || !location.lon || !tz) { //legg inn sjekk for å vente til ny tidsone oppdaters
			return;
		}

		let cancelled = false;

		async function loadData() {
			const fetchKey = `${location.lat},${location.lon},${hoursAhead},${tz}`;

			if (lastFetchedRef.current === fetchKey) {
				return;
			}

			lastFetchedRef.current = fetchKey;

			try {
				setLoading(true);
				setError(null);

				const forecastResult = await getForecastUseCase.execute({
					lat: location.lat,
					lon: location.lon,
					hoursAhead,
					timeZone: tz
				});

				if (cancelled) {
					return;
				}

				const grouped = {};

				Object.entries(forecastResult.hourlyByDate).forEach(([dateISO, data]) => {
					const firstHour = data.hours[0];

					grouped[dateISO] = {
						label: firstHour
							? formatToLocalDateLabel(firstHour.timeISO, tz)
							: "",
						hours: data.hours
					};
				});

				setForecast(grouped);
				setDailySummaryByDate(forecastResult.dailySummaryByDate);

				const alertsResult = await getAlertsUseCase.execute({
					lat: location.lat,
					lon: location.lon
				});

				if (!cancelled) {
					setAlerts(alertsResult.alerts ?? []);
					setAlertsByDate(alertsResult.alertsByDate ?? {});
				}

				const isoDates = Object.keys(grouped);

				const sunTimes = await getSunTimesUseCase.execute({
					lat: location.lat,
					lon: location.lon,
					isoDates,
					timeZone: tz,
					formatToLocalTime
				});

				if (!cancelled) {
					setSunTimesByDate(sunTimes);
				}

				const current = await getCurrentWeatherUseCase.execute({
					lat: location.lat,
					lon: location.lon,
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
	}, [location.lat, location.lon, hoursAhead, tz, getForecastUseCase, getAlertsUseCase, getSunTimesUseCase, getCurrentWeatherUseCase]);

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

		onResetToDeviceLocation: () => searchViewModel.onResetLocation()
	};
}