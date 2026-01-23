import { useEffect, useState } from "react";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
    //location state
    const [location, setLocation] = useState({lat: initialLat, lon: initialLon, name: null});

    //search state
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    //weather state
    const [forecast, setForecast] = useState([]);
    const [sunTimes, setSunTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* SEARCH LOGIC */
    async function onSearchChange(text) {
        setQuery(text);

        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        const results = await geocodingRepository.getSuggestions(text);
        setSuggestions(results);
    }

    function onSuggestionSelected(suggestion) {
        setLocation({
            lat: suggestion.lat,
            lon: suggestion.lon,
            name: suggestion.name
        });

        setQuery(suggestion.name);
        setSuggestions([]);
    }

    /* WEATHER FETCHING */
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const forecastData = await forecastRepository.getHourlyForecast(location.lat, location.lon, hoursAhead);

                const dateISO = forecastData.length > 0
                        ? forecastData[0].date.split(".").reverse().join("-")
                        : null;

                const sunData = dateISO
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
                setError(e.message ?? "Ukjent feil");
            } 
            
            finally {
                setLoading(false);
            }
        }

        loadData();
    }, [location.lat, location.lon, hoursAhead]);

    return {
        // data
        forecast,
        sunTimes,
        loading,
        error,
        location,

        // search state
        query,
        suggestions,

        // actions
        onSearchChange,
        onSuggestionSelected
    };
}
