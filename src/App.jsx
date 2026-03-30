// src/App.jsx
import { useState, useCallback } from "react";
import { useGeolocation } from "./geolocation/useGeolocation.js";
import useActiveLocation from "./hooks/useActiveLocation.js";
import useSearchViewModel from "./ui/viewmodel/SearchViewModel.js";

import "./ui/style/Global.css";

import { NAV_SCREENS } from "./navigation/navGraph.js";

import {
    getForecastUseCase,
    getAlertsUseCase,
    getAllAlertsUseCase,
    getCurrentWeatherUseCase,
    searchLocationUseCase,
    getLocationNameUseCase,
    getSunTimesUseCase,
    getMapWeatherUseCase,
    getLocationGeometryUseCase,
    mapTilerRepository,
} from "./di/dependencies.js";

import useForecastPageViewModel from "./ui/viewmodel/ForecastPageViewModel.js";
import useGraphScreenViewModel from "./ui/viewmodel/GraphScreenViewModel.js";
import useAlertPageViewModel from "./ui/viewmodel/AlertPageViewModel.js";
import useMapPageViewModel from "./ui/viewmodel/MapPageViewModel.js";

import ForecastPage from "./ui/view/pages/ForecastPage.jsx";
import GraphPage from "./ui/view/pages/GraphPage.jsx";
import AlertPage from "./ui/view/pages/AlertPage.jsx";
import MapPage from "./ui/view/pages/MapPage.jsx";

import Header from "./ui/view/components/Common/Layout/Header.jsx";
import Footer from "./ui/view/components/Common/Layout/Footer.jsx";
import LoadingSpinner from "./ui/view/components/Common/LoadingSpinner/LoadingSpinner.jsx";

export default function App() {
    const hoursAhead = 120;
    const [activeScreen, setActiveScreen] = useState(NAV_SCREENS.TABLE);

    const { loading, error, coords } = useGeolocation();

    const {
        activeLocation,
        handleLocationChange,
        handleResetToDeviceLocation
    } = useActiveLocation(coords, getLocationNameUseCase);

    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        handleLocationChange,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        handleResetToDeviceLocation
    );

    // MapPageViewModel trenger en reset-callback som den kan utvide med kart-spesifikk logikk
    const mapPageViewModel = useMapPageViewModel(
        mapTilerRepository,
        getMapWeatherUseCase,
        getLocationGeometryUseCase,
        activeLocation,
        coords,
        handleLocationChange,
        handleResetToDeviceLocation
    );

    const forecastPageViewModel = useForecastPageViewModel(
        getForecastUseCase,
        getAlertsUseCase,
        getCurrentWeatherUseCase,
        getSunTimesUseCase,
        activeLocation,
        hoursAhead
    );

    const graphScreenViewModel = useGraphScreenViewModel(forecastPageViewModel);
    const alertPageViewModel = useAlertPageViewModel(getAllAlertsUseCase);

    // Samlet reset som kombinerer søk + kart + lokasjon
    const handleFullReset = useCallback(() => {
        searchViewModel.onResetLocation();      // Tømmer søkefelt + suggestions
        mapPageViewModel.resetMapState();        // Nullstiller weatherPoints, resetCounter osv.
        // handleResetToDeviceLocation kalles allerede inne i searchViewModel.onResetLocation
    }, [searchViewModel, mapPageViewModel]);

    const searchProps = {
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: handleFullReset
    };

    if (loading) {
        return <LoadingSpinner />;
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
                    searchProps={searchProps}
                    activeScreen={activeScreen}
                    onChangeScreen={setActiveScreen}
                    SCREENS={NAV_SCREENS}
                />
            )}

            {activeScreen === NAV_SCREENS.GRAPH && (
                <GraphPage
                    viewModel={graphScreenViewModel}
                    searchProps={searchProps}
                    activeScreen={activeScreen}
                    onChangeScreen={setActiveScreen}
                    SCREENS={NAV_SCREENS}
                />
            )}

            {activeScreen === NAV_SCREENS.MAP && (
                <MapPage
                    viewModel={mapPageViewModel}
                    searchProps={searchProps}
                    activeScreen={activeScreen}
                    onChangeScreen={setActiveScreen}
                    SCREENS={NAV_SCREENS}
                />
            )}

            <Footer />
        </>
    );
}