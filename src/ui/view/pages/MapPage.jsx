//src/ui/view/pages/MapPage.jsx
import Navigation from "../../../navigation/Navigation.jsx";
import SearchField from "../components/Common/SearchFeild/SearchField.jsx";
import WeatherMap from "../components/MapPage/WeatherMap.jsx";
import LoadingSpinner from "../components/Common/LoadingSpinner/LoadingSpinner.jsx";

export default function MapPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {
	
	return (
		<div className="map-screen">
			<header className="map-header">
				<h1>{viewModel.activeLocation.name || "Værkart"}</h1>
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
				{viewModel.isLoading && (
					<div className="map-loading-overlay">
						<LoadingSpinner />
					</div>
				)}

				<WeatherMap
					mapStyle={viewModel.mapStyle}
					mapTarget={viewModel.mapTarget}
					weatherPoints={viewModel.weatherPoints}
					onMapChange={viewModel.onMapChange}
					activeLocation={viewModel.activeLocation}
					deviceCoords={viewModel.deviceCoords}
					highlightGeometry={viewModel.highlightGeometry}
					countryCode={viewModel.countryCode}
					activeLayer={viewModel.activeLayer}
					onLayerChange={viewModel.onLayerChange}
					showMarkersWithLayer={viewModel.showMarkersWithLayer}
					onToggleMarkers={viewModel.onToggleMarkers}
				/>
			</main>
		</div>
	);
}