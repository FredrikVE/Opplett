// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import useSearchViewModel from "./SearchViewModel.js";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
    
    // Statevariabel for location og søkemekanikk fra useSearchViewModel-hooken
    const [location, setLocation] = useState({ lat: initialLat, lon: initialLon, name: null });
    const searchViewModel = useSearchViewModel( geocodingRepository, setLocation);

    // Statevariabler for værmeldingsresultater
    const [forecast, setForecast] = useState([]);
    const [sunTimes, setSunTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetching av værmelding
    useEffect(() => {
        async function loadData() {
            
            try {
                setLoading(true);

                const forecastData =
                    await forecastRepository.getHourlyForecast(
                        location.lat,
                        location.lon,
                        hoursAhead
                    );

                const dateISO =
                    forecastData.length > 0
                        ? forecastData[0].date.split(".").reverse().join("-")
                        : null;

                const sunData =
                    dateISO
                        ? await sunriseRepository.getSunTimes(
                            location.lat,
                            location.lon,
                            dateISO,
                            "+01:00"
                        )
                        : null;

                setForecast(forecastData);
                setSunTimes(sunData);
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

    }, 
    //Dependancy array for useEffect()
    [location.lat, location.lon, hoursAhead]);

    //Rerunerer objekt med resulteter til view fra ViewModel
    return {
        //Vær
        forecast,
        sunTimes,
        loading,
        error,
        location,

        // Søkeresultater
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected
    };
}
