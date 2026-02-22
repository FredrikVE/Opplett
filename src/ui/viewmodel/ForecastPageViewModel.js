//src/ui/viewmodel/ForecastPageViewModel.js
import { useEffect, useState, useRef, useMemo } from "react";
import { fetchInitialLocationName } from "../utils/LocationUtils/fetchInitialLocationName.js";
import { resolveTimezone, formatToLocalTime, formatToLocalDateLabel, formatLocalDate, formatLocalDateTime, getLocalHour } from "../utils/TimeZoneUtils/timeFormatters.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function useForecastPageViewModel(getForecastUseCase, geocodingRepository, initialLat, initialLon, hoursAhead) {
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

				const result = await getForecastUseCase.execute({ lat: location.lat, lon: location.lon, hoursAhead, timeZone: tz, formatToLocalTime });

				if (cancelled) {
					return;
				}

				const initialGrouped = {};
				Object.entries(result.hourlyByDate).forEach(([dateISO, data]) => {
					const firstHour = data.hours[0];
					initialGrouped[dateISO] = {
						label: firstHour ? formatToLocalDateLabel(firstHour.timeISO, tz) : "",
						hours: data.hours
					};
				});

				setForecast(initialGrouped);
				setDailySummaryByDate(result.dailySummaryByDate);
				setSunTimesByDate(result.sunTimesByDate);
				setAlerts(result.alerts ?? []);
				setAlertsByDate(result.alertsByDate ?? {});

				const firstDateKey = Object.keys(initialGrouped)[0];
				const firstHour = firstDateKey
					? initialGrouped[firstDateKey].hours[0]
					: null;

				setCurrentWeather(firstHour ?? null);

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
	[location.lat, location.lon, hoursAhead, tz, getForecastUseCase]);

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