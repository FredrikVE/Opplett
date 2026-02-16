//src/App.jsx
import { useState } from "react";
import { useGeolocation } from "./geolocation/useGeolocation.js";

//Stilark
import "./ui/style/App.css";
import "./ui/style/LoadingSpinner.css";
import "./ui/style/SolarInfo.css";
import "./ui/style/SearchFeild.css";
import "./ui/style/Alerts.css";
import "./ui/style/ForecastTable.css";
import "./ui/style/DayForecastCard.css";
import "./ui/style/HomePage.css";
import "./ui/style/GraphPage.css";
import "./ui/style/Header.css";
import "./ui/style/Footer.css";
import "./ui/style/NavButton.css"
import "./ui/style/NowCard.css"
import "./ui/style/UVNowBar.css";

//Navigation
import Navigation from "./navigation/Navigation.jsx";
import { NAV_SCREENS } from "./navigation/navGraph.js";

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
import useGraphScreenViewModel from "./ui/viewmodel/GraphScreenViewModel.js";

import HomePage from "./ui/view/pages/HomePage.jsx";
import GraphPage from "./ui/view/pages/GrapPage.jsx";
import LoadingSpinner from "./ui/view/components/LoadingSpinner/LoadingSpinner.jsx";

//Header og footer
import Header from "./ui/view/components/Common/Layout/Header.jsx"
import Footer from "./ui/view/components/Common/Layout/Footer.jsx";

//Importerer klasse for vasking og forenkling av stedsnavn fra OpenCage
import LocationNameFormatter from "./geolocation/LocationNameFormatter.js";

//Instansierer LocationFormatter of penere formatering av stedsnavn
const locationNameFormatter = new LocationNameFormatter();

const formatLocation = (locationData) => {
	return locationNameFormatter.format(locationData);
}

//Initialiserer instanser utenfor komponentens livssyklus for stabilitet og unødvendige re-renders.
//Dette hindrer doble instanser ved re-renders og fikser teller-problemet i loggen.
const locationRepo = new LocationForecastRepository(new LocationForecastDataSource());
const sunriseRepo = new SunriseRepository(new SunriseDataSource());
const alertsRepo = new MetAlertsRepository(new MetAlertsDataSource());
const geoRepo = new OpenCageGeocodingRepository(new OpenCageGeocodingDataSource(), formatLocation);

export default function App() {
	const hoursAhead = 120;

	const [activeScreen, setActiveScreen] = useState(NAV_SCREENS.TABLE);

	//Henter koordinater fra enheten (starter som null)
	const { loading, error, coords } = useGeolocation();

	//Initialiser ViewModel med dependancy injection av repositories
	const homeScreenViewModel = useHomeScreenViewModel(locationRepo, sunriseRepo, alertsRepo, geoRepo, coords?.lat,  coords?.lon, hoursAhead);
	const graphScreenViewModel = useGraphScreenViewModel(homeScreenViewModel);

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

			<Navigation
				activeScreen={activeScreen}
				onChangeScreen={setActiveScreen}
				SCREENS={NAV_SCREENS}
			/>

			{activeScreen === NAV_SCREENS.TABLE && (
				<HomePage viewModel={homeScreenViewModel} />
			)}

			{activeScreen === NAV_SCREENS.GRAPH && (
				<GraphPage viewModel={graphScreenViewModel} />
			)}

			<Footer />
		</>
	);
}