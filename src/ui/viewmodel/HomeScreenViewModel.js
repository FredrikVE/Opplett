// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
  
  // State for lokasjon
 const initialLocation = { lat: initialLat, lon: initialLon, name: null, timezone: null };
 const [location, setLocation] = useState(initialLocation);

  //Lytter etter endringer knyttet til initialLat og initialLon. Laster inn når GPS finner koordinatene.
  useEffect(() => {
    if (initialLat && initialLon) {
        setLocation(prev => ({
            ...prev,
            lat: initialLat,
            lon: initialLon
        }));
    }
  }, [initialLat, initialLon]);

  const searchViewModel = useSearchViewModel(geocodingRepository, setLocation);

  const [forecast, setForecast] = useState({});
  const [dailyPeriods, setDailyPeriods] = useState({});
  const [sunTimes, setSunTimes] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // Start loading som false, vi setter den til true når vi faktisk har data å hente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!location.lat || !location.lon) {
		return;
	};

    fetchInitialLocationName(setLocation, geocodingRepository, location.lat, location.lon);
  }, 
  [location.lat, location.lon, geocodingRepository]);

  // Henter data med null-sjekk
  useEffect(() => {
    async function loadData() {

      try {
        setLoading(true);

        const tz = location.timezone ?? "UTC";

        const [forecastData, dailyPeriodForecast, alertResults] = await Promise.all([
			
			forecastRepository.getHourlyForecastGroupedByDate(location.lat, location.lon, hoursAhead, tz),
			forecastRepository.getDailyPeriodForecast(location.lat, location.lon, hoursAhead, tz),
			metAlertsRepository.findAlerts(location.lat, location.lon),
        ]);

        const firstDateLabel = Object.keys(forecastData)[0] ?? null;
        const firstItem = firstDateLabel ? forecastData[firstDateLabel]?.[0] : null;
        const dateISO = firstItem?.dateISO ?? null;

        const sunData = dateISO? await sunriseRepository.getSunTimes(location.lat, location.lon, dateISO, tz) : null;

        setForecast(forecastData);
        setDailyPeriods(dailyPeriodForecast);
        setSunTimes(sunData);
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
  [location.lat, location.lon, location.timezone, hoursAhead, forecastRepository, sunriseRepository, metAlertsRepository]);

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