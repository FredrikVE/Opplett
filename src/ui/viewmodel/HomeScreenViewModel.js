// src/ui/viewmodel/HomeScreenViewModel.js
import { useEffect, useState } from "react";
import { fetchInitialLocationName } from "../utils/fetchInitialLocationName.js";
import useSearchViewModel from "./SearchViewModel.js";

export default function HomeScreenViewModel( forecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, initialLat, initialLon, hoursAhead ) {
    
    //Statevariabel for location og søkemekanikk fra useSearchViewModel-hooken
    const initialLocation = {lat: initialLat, lon: initialLon, name: null};     //oppretter er locationObjekt med init-lat/lon og tomt navn
    const [location, setLocation] = useState(initialLocation);                      //setter initialLocation objektet inni statevariablen fra start
    const searchViewModel = useSearchViewModel( geocodingRepository, setLocation);

    // Statevariabler for værmeldingsresultater, soloppgang, og metalerts
    const [forecast, setForecast] = useState([]);
    const [sunTimes, setSunTimes] = useState(null);
    const [alerts, setAlerts] = useState([]);
 
    // Error og loading states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //Henter stedsnavn for startkoordinater én gang ved oppstart
    useEffect(() => {
        //Påkaller utmodularisert funksjon i ui/utils som setter startlokasjonsnavn fra start koordinater.
        fetchInitialLocationName(setLocation, geocodingRepository, initialLat, initialLon);
    }, 
    //[initialLat, initialLon, geocodingRepository]);
    [initialLat, initialLon]);

    // Fetching av værmelding
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                
                //Værmelding
                //const forecastData = await forecastRepository.getHourlyForecast(
                const forecastData = await forecastRepository.getHourlyForecastGroupedByDate(
                    location.lat,
                    location.lon,
                    hoursAhead
                );

                const dateISO = forecastData.length > 0
                        ? forecastData[0].date.split(".").reverse().join("-")
                        : null;

                // Soltider
                const sunData = dateISO? await sunriseRepository.getSunTimes(
                        location.lat,
                        location.lon,
                        dateISO,
                        "+01:00"
                    )
                    : null;

                //Farevarsler
                const alertResults = await metAlertsRepository.findAlerts(location.lat, location.lon);
                
                //Oppdaterer states med settefunksjoner
                setForecast(forecastData);
                setSunTimes(sunData);
                setAlerts(alertResults.alerts);
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
    //Dependancy array for useEffect()
    [location.lat, location.lon, hoursAhead]);  //refresher hvis antall timer frem endres eller lat/lon endres

    //Rerunerer objekt med resulteter til view fra ViewModel
    return {
        //Vær
        forecast,
        sunTimes,

        //Alerts
        alerts,

        //UI-states
        loading,
        error,

        //Lokasjon
        location,

        //Søkeresultater
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected
    };
}
