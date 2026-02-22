// src/ui/view/pages/MapPage.jsx
import Navigation from "../../../navigation/Navigation.jsx";
import SearchField from "../components/Common/SearchFeild/SearchField.jsx";
import WeatherMap from "../components/MapPage/WeatherMap.jsx";

export default function MapPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
	const { location, mapCenter, zoom, apiKey, style } = viewModel;

	return (
		<div className="map-screen">
			<header className="map-header">
				<h1>{location.name || "Min posisjon"}</h1>
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
				<WeatherMap
					apiKey={apiKey}
					style={style}
					lat={mapCenter.lat}
					lon={mapCenter.lon}
					zoom={zoom}
					//currentWeather={viewModel.currentWeather}
					weatherPoints={viewModel.weatherPoints} // Pass på at navnet matcher
				/>
			</main>
		</div>
	);
}