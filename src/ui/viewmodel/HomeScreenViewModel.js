// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
  const initialLocation = { lat: initialLat, lon: initialLon, name: null, timezone: null };

  const [location, setLocation] = useState(initialLocation);
  const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

  const [forecast, setForecast] = useState({});
  const [dailyPeriods, setDailyPeriods] = useState({});
  const [sunTimes, setSunTimes] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
	fetchInitialLocationName(setLocation, geocodingRepository, initialLat, initialLon);
  }, 
  [initialLat, initialLon, geocodingRepository]);	//tror dette gir DDOS på OpenCage...
  //[initialLat, initialLon]);

  useEffect(() => {
	async function loadData() {
	  try {
		setLoading(true);

		const tz = location.timezone ?? "UTC";

		const [forecastData, dailyPeriodForecast, alertResults] = await Promise.all([
		  forecastRepository.getHourlyForecastGroupedByDate(
			location.lat,
			location.lon,
			hoursAhead,
			tz
		  ),
		  forecastRepository.getDailyPeriodForecast(
			location.lat,
			location.lon,
			hoursAhead,
			tz
		  ),
		  metAlertsRepository.findAlerts(location.lat, location.lon),
		]);

		// Finn "første dag" fra forecast (keys er DD.MM.YYYY hos deg)
		const firstDateLabel = Object.keys(forecastData)[0] ?? null;

		// Hvis du legger inn dateISO på items (anbefalt):
		// Hent ISO fra første element i første dag:
		const firstItem = firstDateLabel ? forecastData[firstDateLabel]?.[0] : null;
		const dateISO = firstItem?.dateISO ?? null;

		const sunData = dateISO
		  ? await sunriseRepository.getSunTimes(
			  location.lat,
			  location.lon,
			  dateISO,
			  tz
			)
		  : null;

		setForecast(forecastData);
		setDailyPeriods(dailyPeriodForecast);
		setSunTimes(sunData);
		setAlerts(alertResults?.alerts ?? []);
		setError(null);
	  } 
	  
	  catch (e) {
		setError(e?.message ?? "Ukjent feil");
	  } 
	  
	  finally {
		setLoading(false);
	  }
	}

	loadData();
  }, [location.lat, location.lon, location.timezone, hoursAhead, forecastRepository, sunriseRepository, metAlertsRepository]);

  return {
	forecast,
	sunTimes,
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
