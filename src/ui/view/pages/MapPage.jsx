// src/ui/view/pages/MapPage.jsx

import Navigation from "../../../navigation/Navigation.jsx";
import SearchField from "../components/Common/SearchFeild/SearchField.jsx";
import WeatherMap from "../components/MapPage/WeatherMap.jsx";
import LoadingSpinner from "../components/Common/LoadingSpinner/LoadingSpinner.jsx";

export default function MapPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
	const { location, mapTarget, apiKey, style, weatherPoints, isLoading, onMapChange, highlightGeometry, currentZoom } = viewModel;
	
	console.log("Zoomlevel: ", currentZoom);

	return (
		<div className="map-screen">
			<header className="map-header">
				<h1>{location.name || "Værkart"}</h1>
			</header>

			<SearchField
				query={viewModel.query}
				suggestions={viewModel.suggestions}
				onSearchChange={viewModel.onSearchChange}
				onSuggestionSelected={viewModel.onSuggestionSelected}
				onResetToDeviceLocation={viewModel.onResetToDeviceLocation}
			/>

			<Navigation
				activeScreen={activeScreen}
				onChangeScreen={onChangeScreen}
				SCREENS={SCREENS}
			/>

			<main className="map-content">
				{isLoading && (
					<div className="map-loading-overlay">
						<LoadingSpinner />
					</div>
				)}

				{currentZoom != null && (
					<div className="zoom-indicator">
						Zoom: {Math.round(currentZoom)}
					</div>
				)}

				<WeatherMap
					apiKey={apiKey}
					style={style}
					mapTarget={mapTarget}
					weatherPoints={weatherPoints}
					onMapChange={onMapChange}
					activeLocation={location}
					highlightGeometry={highlightGeometry}
				/>
			</main>
		</div>
	);
}