// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";

export default function HomeScreenViewModel(forecastRepository, sunriseRepository, lat, lon, hoursAhead) {

    // Statevariabler
    const [forecast, setForecast] = useState([]);
    const [sunTimes, setSunTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadData() {
            try {
                // Henter værmelding
                const forecastData =
                    await forecastRepository.getHourlyForecast(lat, lon, hoursAhead);

                // Bruker datoen fra første værpunkt til sunrise
                const dateISO =
                    forecastData.length > 0
                        ? forecastData[0].date.split(".").reverse().join("-")
                        : null;

                let sunData = null;

                if (dateISO) {
                    sunData = await sunriseRepository.getSunTimes(lat, lon, dateISO, "+01:00");
                }

                setForecast(forecastData);
                setSunTimes(sunData);
            } 
            
            catch (error) {
                setError(error?.message ?? "Unknown error");
            } 
            
            finally {
                setLoading(false);
            }
        }

        loadData();
    }, [forecastRepository, sunriseRepository, lat, lon, hoursAhead]);

    return { forecast, sunTimes, loading, error };
}
