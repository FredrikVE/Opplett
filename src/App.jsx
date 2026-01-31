// src/App.jsx
import { useMemo } from "react";
import { useGeolocation } from "./geolocation/useGeolocation.js";

import "./ui/style/App.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/Alerts.css";
import "./ui/style/Header.css";
import "./ui/style/ForecastTable.css";
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

    //Henter først posisjon. coords starter som { lat: null, lon: null }
    const { loading, error, coords } = useGeolocation();

    //Oppretter repositories
    const repositories = useMemo(() => {
        return {
            locationForecastRepository: new LocationForecastRepository(new LocationForecastDataSource()),
            sunriseRepository: new SunriseRepository(new SunriseDataSource()),
            metAlertsRepository: new MetAlertsRepository(new MetAlertsDataSource()),
            geocodingRepository: new OpenCageGeocodingRepository(new OpenCageGeocodingDataSource())
        };
    }, []);

    //Initialiser ViewModel her før før loading og error-sjekker
    //Sender inn coords.lat/lon selv om de er null. ViewModelen håndterer ventingen.
    const homeScreenViewModel = HomeScreenViewModel(
        repositories.locationForecastRepository,
        repositories.sunriseRepository,
        repositories.metAlertsRepository,
        repositories.geocodingRepository,
        coords?.lat, 
        coords?.lon,
        hoursAhead
    );

    //Conditional Rendering med loading og error-stated
    if (loading) {
        return <div className="loading-screen">Henter din posisjon...</div>;
    }

    if (error) {
        return (
            <div className="error-screen">
                <h2>Fant ikke posisjon</h2>
                <p>Du må tillate posisjon for å bruke appen.</p>
            </div>
        );
    }

    //Når alt er klart vises appen
    return <HomeScreen viewModel={homeScreenViewModel} />;
}