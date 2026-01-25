//src/App.jsx
import "./ui/style/App.css"
import "./ui/style/SolarInfo.css"
import "./ui/style/SearchFeild.css"
import "./ui/style/Alerts.css"
import "./ui/style/Header.css"
import "./ui/style/HomeScreen.css"

import OpenCageGeocodingDataSource from "./model/datasource/OpenCageGeocodingDataSource.js";
import OpenCageGeocodingRepository from "./model/repositories/OpenCageGeocodingRepository.js";
import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js"
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";

import MetAlertsDataSource from "./model/datasource/MetAlertsDataSource.js";
import MetAlertsRepository from "./model/repositories/MetAlertsRepository.js";


import HomeScreenViewModel from "./ui/viewmodel/HomeScreenViewModel.js";
import HomeScreen from "./ui/view/pages/HomeScreen.jsx";
import SunriseRepository from "./model/repositories/SunriseRepository.js";
import SunriseDataSource from "./model/datasource/SunriseDataSource.js";

export default function App() {

    //Definerer startbetingelser som startkorrdinater og antall timer frem som væremeldingen skal være for
    //const lat = 59.86;
    //const lon = 10.82;
    const lat = 27.777835
    const lon = -15.692579
    const hoursAhead = 12;

    //Initierer DataSources
    const locationForecastDatasource = new LocationForecastDataSource();
    const sunriseDataSource = new SunriseDataSource();
    const geocodingDataSource = new OpenCageGeocodingDataSource();
    const metAlertsDataSource = new MetAlertsDataSource();

    //Initierer Repositories med tilhørende datasources
    const locationForecastRepository = new LocationForecastRepository(locationForecastDatasource);
    const sunriseRepository = new SunriseRepository(sunriseDataSource);
    const metAlertsRepository = new MetAlertsRepository(metAlertsDataSource);
    const geocodingRepository = new OpenCageGeocodingRepository(geocodingDataSource);
    
    //Oppretter ViewModeller som skal sendes inni veiws (dvs pages)
    const homeScreenViewModel = HomeScreenViewModel(locationForecastRepository, sunriseRepository, metAlertsRepository ,geocodingRepository, lat, lon, hoursAhead);

    //Returnerer og rendrer de komponentene som utgjør views/pages
    return <HomeScreen viewModel={homeScreenViewModel} />;
}
