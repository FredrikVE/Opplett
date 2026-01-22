//src/App.jsx
import "./ui/style/App.css"
import "./ui/style/HomeScreen.css"

import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js"
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";
import HomeScreenViewModel from "./ui/viewmodel/HomeScreenViewModel.js";
import HomeScreen from "./ui/view/HomeScreen.jsx";
import SunriseRepository from "./model/repositories/SunriseRepository.js";
import SunriseDataSource from "./model/datasource/SunriseDataSource.js";

export default function App() {

    //const lat = 59.86;
    //const lon = 10.82;
    const lat = 27.777835
    const lon = -15.692579
    const hoursAhead = 12;

    const locationForecastDatasource = new LocationForecastDataSource();
    const sunriseDataSource = new SunriseDataSource();

    const locationForecastRepository = new LocationForecastRepository(locationForecastDatasource);
    const sunriseRepository = new SunriseRepository(sunriseDataSource);

    const homeScreenViewModel = HomeScreenViewModel(locationForecastRepository, sunriseRepository, lat, lon, hoursAhead);

    return <HomeScreen viewModel={homeScreenViewModel} />;
}
