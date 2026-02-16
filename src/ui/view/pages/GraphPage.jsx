//src/ui/view/pages/GraphPage.jsx
import Navigation from "../../../navigation/Navigation.jsx";
import WeatherGraph from "../components/HomePage/Graph/WeatherGraph.jsx";
import WindGraph from "../components/HomePage/Graph/WindGraph.jsx";
import SunGraph from "../components/HomePage/Graph/SunGraph.jsx";
import UVGraph from "../components/HomePage/Graph/UVGraph.jsx";
import SearchField from "../components/HomePage/SearchFeild/SearchField.jsx";

export default function GraphPage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {

	if (viewModel.loading) {
		return <LoadingSpinner />;
	}

	if (viewModel.error) {
		return <p>Feil: {viewModel.error}</p>;
	}

	const allHourlyData = viewModel.hourlyData.slice(0, 48);

	return (
		<div className="graph-screen">

			<header className="graph-header">
				<h1>{viewModel.location?.name || "Min posisjon"}</h1>
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

			<section className="graph-meteogram-section">

				<WeatherGraph
					hourlyData={allHourlyData}
					getLocalHour={viewModel.getLocalHour}
					formatLocalDate={viewModel.formatLocalDate}
				/>

				<WindGraph
					hourlyData={allHourlyData}
					getLocalHour={viewModel.getLocalHour}
					formatLocalDate={viewModel.formatLocalDate}
				/>

				<UVGraph
					hourlyData={allHourlyData}
					getLocalHour={viewModel.getLocalHour}
					formatLocalDate={viewModel.formatLocalDate}
				/>

				<SunGraph
					sunTimesByDate={viewModel.sunTimesByDate}
					formatLocalDate={viewModel.formatLocalDate}
				/>

			</section>

		</div>
	);
}
