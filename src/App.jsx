//src/App.jsx
import { useGeolocation } from "./geolocation/useGeolocation.js";

//Stilark
import "./ui/style/App.css";
import "./ui/style/LoadingSpinner.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/Alerts.css";
import "./ui/style/Header.css";
import "./ui/style/ForecastTable.css";
import "./ui/style/DayForecastCard.css";
import "./ui/style/HomePage.css";

//DataSources
import OpenCageGeocodingDataSource from "./model/datasource/OpenCageGeocodingDataSource.js";
import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js";
import MetAlertsDataSource from "./model/datasource/MetAlertsDataSource.js";
import SunriseDataSource from "./model/datasource/SunriseDataSource.js";

//Repositories
import OpenCageGeocodingRepository from "./model/repositories/OpenCageGeocodingRepository.js";
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";
import MetAlertsRepository from "./model/repositories/MetAlertsRepository.js";
import SunriseRepository from "./model/repositories/SunriseRepository.js";

//ViewModel og View
import useHomeScreenViewModel from "./ui/viewmodel/HomeScreenViewModel.js";
import HomePage from "./ui/view/pages/HomePage.jsx";
import LoadingSpinner from "./ui/view/components/LoadingSpinner/LoadingSpinner.jsx";

//Initialiserer instanser utenfor komponentens livssyklus for stabilitet og unødvendige re-renders.
//Dette hindrer doble instanser ved re-renders og fikser teller-problemet i loggen.
const locationRepo = new LocationForecastRepository(new LocationForecastDataSource());
const sunriseRepo = new SunriseRepository(new SunriseDataSource());
const alertsRepo = new MetAlertsRepository(new MetAlertsDataSource());
const geoRepo = new OpenCageGeocodingRepository(new OpenCageGeocodingDataSource());

export default function App() {
    const hoursAhead = 120;

    //Henter koordinater fra enheten (starter som null)
    const { loading, error, coords } = useGeolocation();

    //Initialiser ViewModel med dependancy injection av repositories
    const homeScreenViewModel = useHomeScreenViewModel(locationRepo, sunriseRepo, alertsRepo, geoRepo, coords?.lat,  coords?.lon, hoursAhead);

    if (loading) {
        return (
            <LoadingSpinner />
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <h2>Posisjon ikke tilgjengelig</h2>
                <button onClick={() => window.location.reload()}>Prøv GPS på nytt</button>
        </div>
        );
    }

    return (
        <HomePage viewModel={homeScreenViewModel} />
    );
}