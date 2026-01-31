// src/App.jsx
import { useMemo, useState, useEffect } from "react";

import "./ui/style/App.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/Alerts.css";
import "./ui/style/Header.css";
import "./ui/style/HomeScreen.css";
import "./ui/style/DayForecastCard.css";

import OpenCageGeocodingDataSource from "./model/datasource/OpenCageGeocodingDataSource.js";
import OpenCageGeocodingRepository from "./model/repositories/OpenCageGeocodingRepository.js";
import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js";
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";
import MetAlertsDataSource from "./model/datasource/MetAlertsDataSource.js";
import MetAlertsRepository from "./model/repositories/MetAlertsRepository.js";
import SunriseRepository from "./model/repositories/SunriseRepository.js";
import SunriseDataSource from "./model/datasource/SunriseDataSource.js";

import HomeScreenViewModel from "./ui/viewmodel/HomeScreenViewModel.js";
import HomeScreen from "./ui/view/pages/HomeScreen.jsx";

export default function App() {

    const hoursAhead = 120;

    // Start alltid med fallback (unngår hook-feil)
    const [coords, setCoords] = useState({          //denne løsningen er ikke helt god.. må fikses.
        lat: 70.674705, // Hammerfest fallback
        lon: 23.667911
    });



    // Hent enhetens lokasjon (oppdaterer kun state)
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            () => {
                // behold fallback
            }
        );
    }, []);

    // Datasources + repositories (stabile referanser)
    const { locationForecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository } = useMemo(() => {
        const locationForecastDatasource = new LocationForecastDataSource();
        const sunriseDataSource = new SunriseDataSource();
        const geocodingDataSource = new OpenCageGeocodingDataSource();
        const metAlertsDataSource = new MetAlertsDataSource();

        return {
            locationForecastRepository: new LocationForecastRepository(locationForecastDatasource),
            sunriseRepository: new SunriseRepository(sunriseDataSource),
            metAlertsRepository: new MetAlertsRepository(metAlertsDataSource),
            geocodingRepository: new OpenCageGeocodingRepository(geocodingDataSource)
        };
    }, []);

    
    const homeScreenViewModel = HomeScreenViewModel(locationForecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, coords.lat, coords.lon, hoursAhead);

    return <HomeScreen viewModel={homeScreenViewModel} />;
}
