// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
	
	//State for geolokasjon
	const initialLocation = { lat: initialLat, lon: initialLon, name: null, timezone: null };
	const [location, setLocation] = useState(initialLocation);

	//Lytter etter endringer knyttet til initialLat og initialLon. Laster inn når GPS finner koordinatene.
	useEffect(() => {
		if (initialLat && initialLon) {
		setLocation((prev) => ({
			...prev,
			lat: initialLat,
			lon: initialLon,
		}));
	}}, 
	[initialLat, initialLon]);

	const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

	const [forecast, setForecast] = useState({});
	const [dailyPeriods, setDailyPeriods] = useState({});
	const [sunTimesByDate, setSunTimesByDate] = useState({});
	const [alerts, setAlerts] = useState([]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

  	useEffect(() => {
		if (!location.lat || !location.lon) {
			return;
		}

    	fetchInitialLocationName(setLocation, geocodingRepository, location.lat, location.lon);
	},
	[location.lat, location.lon, geocodingRepository]);
	
	useEffect(() => {
		if (!location.lat || !location.lon) {
			return;
		}
		
		async function loadData() {
			
			try {
				setLoading(true);

        		// Viktig: tz må være IANA timezone for stedet (f.eks. "America/New_York")
        		const tz = location.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

				const [forecastData, dailyPeriodForecast, alertResults] = await Promise.all([
					forecastRepository.getHourlyForecastGroupedByDate(location.lat, location.lon, hoursAhead, tz),
					forecastRepository.getDailyPeriodForecast(location.lat, location.lon, hoursAhead, tz),
					metAlertsRepository.findAlerts(location.lat, location.lon),
				]);

				// Hent soldata for alle dagene som finnes i forecastData
				const dateLabels = Object.keys(forecastData);
				const sunMap = await sunriseRepository.getSunTimesForDateLabels(location.lat, location.lon, dateLabels, tz);
				
				setForecast(forecastData);
				setDailyPeriods(dailyPeriodForecast);
				setSunTimesByDate(sunMap);
				setAlerts(alertResults?.alerts ?? []);
				setError(null);
			} 

			catch (error) {
				setError(error?.message ?? "Ukjent feil");
			
			} 
			finally {
				setLoading(false);
			}
		}
		loadData();
	}, 
	[location.lat, location.lon, location.timezone, hoursAhead, forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository]);
	
	return {
		forecast,
		sunTimesByDate,
		dailyPeriods,
		alerts,
		loading,
		error,
		location,
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
	};
}