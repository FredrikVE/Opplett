// src/ui/viewmodel/ForecastPageViewModel.js
import { useEffect, useState, useRef, useMemo } from "react";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(getForecastUseCase, getAlertsUseCase, getCurrentWeatherUseCase, searchLocationUseCase, getLocationNameUseCase, getSunTimesUseCase, initialLat, initialLon, hoursAhead) {

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
	const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);

	//SSOT for tidshåndtering
	//Bruk useMemo for å unngå unødvendig re-evaluering av tidssone
	const tz = useMemo(() =>
		resolveTimezone(location.timezone),
	[location.timezone]);

	//UseEffect for å laste inn stedsnavn med reverse geocoding.
	useEffect(() => {

		if (!location.lat || !location.lon) {
			return;
		}

		let cancelled = false;

		async function loadLocationName() {
			try {
				const result = await getLocationNameUseCase.execute({ lat: location.lat, lon: location.lon });
				
				if (cancelled || !result?.name) {
					return;
				}

				setLocation(prev => {
					if (prev.name === result.name && prev.timezone === result.timezone) {
						return prev;
					}
					return { ...prev, name: result.name, timezone: result.timezone };
				});
			}

			catch (error) {
				console.warn("Kunne ikke hente stedsnavn", error);
			}
		}

		loadLocationName();

		//Clean-up-funksjon for å stoppe async state-oppdatering etter at komponenten er unmounted
		return () => { 
			cancelled = true; 
		};
	}, 
	[location.lat, location.lon, getLocationNameUseCase]);


	//UseEffekt for å laste inne dat om værmelding og soltider fra UseCases.
	useEffect(() => {
		if (!location.lat || !location.lon) {
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

				//Henter forecast fra UseCase i Dommenelaget
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
						label: firstHour ? formatToLocalDateLabel(firstHour.timeISO, tz) : "",
						hours: data.hours
					};
				});

				setForecast(grouped);
				setDailySummaryByDate(forecastResult.dailySummaryByDate);

				//Henter farevarsler fra separat UseCase i dommenelaget
				const alertsResult = await getAlertsUseCase.execute({
					lat: location.lat,
					lon: location.lon
				});

				if (!cancelled) {
					setAlerts(alertsResult.alerts ?? []);
					setAlertsByDate(alertsResult.alertsByDate ?? {});
				}

				//Henter sunTimes som separat use case fra dommene lag
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

				//Current current weather fra eget UseCase til NowCard
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

		//Cleanup funksjon
		const timer = setTimeout(loadData, DATA_FETCH_STABILIZATION_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, 
	[location.lat, location.lon, hoursAhead, tz, getForecastUseCase, getAlertsUseCase, getSunTimesUseCase, getCurrentWeatherUseCase]);

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