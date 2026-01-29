//src/App.jsx
import { useMemo } from "react";

import "./ui/style/App.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/Alerts.css";
import "./ui/style/Header.css";
import "./ui/style/HomeScreen.css";

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

    // Init koordinater og antall timer frem
    //const lat = 27.777835;
    //const lon = -15.692579;
    
    //hammerfest (to farevarsler samtidig)
    const lat = 70.674705
    const lon = 23.667911
    //const hoursAhead = 12;
    const hoursAhead = 120;

    // Lag datasources+repositories én gang i useMemo for stabile referanser.
    const { locationForecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository} = useMemo(() => {
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
    }, 
    []      // Tom dependancy array fordi den ikke skal lytte til noe. Kun oppdateres én gang.
    );

    // Opprett ny viewModell
    const homeScreenViewModel = HomeScreenViewModel( locationForecastRepository, sunriseRepository, metAlertsRepository, geocodingRepository, lat, lon, hoursAhead );


    // Rendre skjermene
    return (
        <HomeScreen viewModel={homeScreenViewModel} />
    );
}
