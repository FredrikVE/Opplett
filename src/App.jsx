//src/App.jsx
import { useState } from "react";
import { useGeolocation } from "./geolocation/useGeolocation.js";

//Stilark
import "./ui/style/App.css";
import "./ui/style/LoadingSpinner.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/AlertCard.css";
import "./ui/style/ForecastTable.css";
import "./ui/style/DayForecastCard.css";
import "./ui/style/ForecastPage.css";
import "./ui/style/GraphPage.css";
import "./ui/style/AlertPage.css";
import "./ui/style/Header.css";
import "./ui/style/Footer.css";
import "./ui/style/NavButton.css";
import "./ui/style/NowCard.css";
import "./ui/style/UVNowBar.css";
import "./ui/style/WindArrow.css";
import "./ui/style/FilterDropDown.css";
import "./ui/style/MapPage.css";

//Navigation
import { NAV_SCREENS } from "./navigation/navGraph.js";

//DataSources
import OpenCageGeocodingDataSource from "./model/datasource/OpenCageGeocodingDataSource.js";
import LocationForecastDataSource from "./model/datasource/LocationForecastDataSource.js";
import MetAlertsDataSource from "./model/datasource/MetAlertsDataSource.js";
import SunriseDataSource from "./model/datasource/SunriseDataSource.js";
import MapTilerDataSource from "./model/datasource/MapTilerDataSource.js";

//Repositories
import OpenCageGeocodingRepository from "./model/repositories/OpenCageGeocodingRepository.js";
import LocationForecastRepository from "./model/repositories/LocationForecastRepository.js";
import MetAlertsRepository from "./model/repositories/MetAlertsRepository.js";
import SunriseRepository from "./model/repositories/SunriseRepository.js";
import MapTilerRepository from "./model/repositories/MapTilerRepository.js"
//UseCases fra domain-layer
import GetForecastUseCase from "./model/domain/GetForecastUseCase.js";
import GetAllAlertsUseCase from "./model/domain/GetAllAlertsUseCase.js";
import GetCurrentWeatherUseCase from "./model/domain/GetCurrentWeatherUseCase.js";
import SearchLocationUseCase from "./model/domain/SearchLocationUseCase.js";
import GetLocationNameUseCase from "./model/domain/GetLocationNameUseCase.js";
import GetSunTimesUseCase from "./model/domain/GetSunTimesUseCase.js";
import GetAlertsUseCase from "./model/domain/GetAlertsUseCase.js";
import GetMapConfigUseCase from "./model/domain/GetMapConfigUseCase.js"

//ViewModel og View
import useForecastPageViewModel from "./ui/viewmodel/ForecastPageViewModel.js";
import useGraphScreenViewModel from "./ui/viewmodel/GraphScreenViewModel.js";
import useAlertPageViewModel from "./ui/viewmodel/AlertPageViewModel.js";
import useMapPageViewModel from "./ui/viewmodel/MapPageViewModel.js";

import ForecastPage from "./ui/view/pages/ForecastPage.jsx";
import GraphPage from "./ui/view/pages/GraphPage.jsx";
import AlertPage from "./ui/view/pages/AlertPage.jsx";
import MapPage from "./ui/view/pages/MapPage.jsx";

//Header og footer
import Header from "./ui/view/components/Common/Layout/Header.jsx";
import Footer from "./ui/view/components/Common/Layout/Footer.jsx";
import LoadingSpinner from "./ui/view/components/Common/LoadingSpinner/LoadingSpinner.jsx";

//Importerer klasse for vasking og forenkling av stedsnavn fra OpenCage
import LocationNameFormatter from "./geolocation/LocationNameFormatter.js";

//Instansierer LocationFormatter of penere formatering av stedsnavn
const locationNameFormatter = new LocationNameFormatter();
const formatLocation = (locationData) => {
	return locationNameFormatter.format(locationData);
};

// Repositories (composition root)
const locationRepo = new LocationForecastRepository(new LocationForecastDataSource());
const sunriseRepo = new SunriseRepository(new SunriseDataSource());
const alertsRepo = new MetAlertsRepository(new MetAlertsDataSource());
const geoRepo = new OpenCageGeocodingRepository(new OpenCageGeocodingDataSource(), formatLocation);
const mapTilerRepo = new MapTilerRepository(new MapTilerDataSource());

//Oppretter instanser av UseCasees fra domain-layer
const getForecastUseCase = new GetForecastUseCase(locationRepo, alertsRepo);
const getSunTimesUseCase = new GetSunTimesUseCase(sunriseRepo);
const getAlertsUseCase = new GetAlertsUseCase(alertsRepo);
const getAllAlertsUseCase = new GetAllAlertsUseCase(alertsRepo);
const getCurrentWeatherUseCase = new GetCurrentWeatherUseCase(locationRepo);
const searchLocationUseCase = new SearchLocationUseCase(geoRepo);
const getLocationNameUseCase = new GetLocationNameUseCase(geoRepo);
const getMapConfigUseCase = new GetMapConfigUseCase(mapTilerRepo);

export default function App() {
	const hoursAhead = 120;

	const [activeScreen, setActiveScreen] = useState(NAV_SCREENS.TABLE);

	//Henter koordinater fra enheten (starter som null)
	const { loading, error, coords } = useGeolocation();

	//ViewModel får nå usecase istedenfor repositories
	//Initialiser ViewModel med dependancy injection av useCasees og repositories
	const forecastPageViewModel = useForecastPageViewModel(
		getForecastUseCase, 
		getAlertsUseCase, 
		getCurrentWeatherUseCase, 
		searchLocationUseCase,
		getLocationNameUseCase,
		getSunTimesUseCase, 
		coords?.lat, 
		coords?.lon, 
		hoursAhead
	);

	const mapPageViewModel = useMapPageViewModel(
		getMapConfigUseCase,
		searchLocationUseCase,
		getLocationNameUseCase,
		coords?.lat,
		coords?.lon
	);
	
	const graphScreenViewModel = useGraphScreenViewModel(forecastPageViewModel);
	const alertPageViewModel = useAlertPageViewModel(getAllAlertsUseCase);

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
		<>
			<Header />

			{activeScreen === NAV_SCREENS.ALERTS && (
				<AlertPage
					viewModel={alertPageViewModel}
					activeScreen={activeScreen}
					onChangeScreen={setActiveScreen}
					SCREENS={NAV_SCREENS}
				/>
			)}

			{activeScreen === NAV_SCREENS.TABLE && (
				<ForecastPage
					viewModel={forecastPageViewModel}
					activeScreen={activeScreen}
					onChangeScreen={setActiveScreen}
					SCREENS={NAV_SCREENS}
				/>
			)}

			{activeScreen === NAV_SCREENS.GRAPH && (
				<GraphPage
					viewModel={graphScreenViewModel}
					activeScreen={activeScreen}
					onChangeScreen={setActiveScreen}
					SCREENS={NAV_SCREENS}
				/>
			)}

			{activeScreen === NAV_SCREENS.MAP && (
				<MapPage
					viewModel={mapPageViewModel}
					activeScreen={activeScreen}
					onChangeScreen={setActiveScreen}
					SCREENS={NAV_SCREENS}
				/>
			)}
			<Footer />
		</>
	);
}