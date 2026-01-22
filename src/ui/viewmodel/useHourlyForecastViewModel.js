// src/ui/viewmodel/useHourlyForecastViewModel.js
import { useEffect, useState } from "react";

export default function useHourlyForecastViewModel( repository, lat, lon, hoursAhead ) {

    //statevariabler for resultater, loading og error.
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadForecast() {
            
            try {
                const data = await repository.getHourlyForecast(lat, lon, hoursAhead);
                setForecast(data);
            } 
            
            catch (error) {
                setError(error?.message ?? "Unknown error");
            } 
            
            finally {
                setLoading(false);
            }
        }

        loadForecast();
    }, []);

    return { forecast, loading, error };
}
