//src/ui/view/pages/GrapPage.jsx
import WeatherGraph from "../components/HomePage/Graph/WeatherGraph.jsx";
import WindGraph from "../components/HomePage/Graph/WindGraph.jsx";
import SunGraph from "../components/HomePage/Graph/SunGraph.jsx";
import UVGraph from "../components/HomePage/Graph/UVGraph.jsx";

export default function GraphPage({ viewModel }) {

	const entries = Object.entries(viewModel.forecast);

	// Neste 48 timer
	const allHourlyData = entries
		.flatMap(([, dayData]) => dayData.hours)
		.slice(0, 48);

	return (
		<section className="meteogram-section">

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
	);
}
