//src/ui/view/components/MapPage/Forecastmap/WeatherSymbolLabel.jsx
import { getWeatherIconFileName } from "../../../../utils/CommonUtils/weatherIcons.js"

export default function WeatherSymbolLabel({ point }) {

	const iconFile = getWeatherIconFileName(point.weatherSymbol);
	console.log("Sted som viseer værsymbol: ", point.name);

	return (
		<div className="map-weather-marker">
			<div className="marker-container">
				<img
					src={`/weather_icons/100/${iconFile}`}
					className="marker-icon"
					alt="vær"
				/>
				<div className="marker-details">
					<span className="marker-temp">
						{Math.round(point.temp)}°
					</span>
					<span className="marker-name">
						{point.name || ""}
					</span>
				</div>
			</div>
		</div>
	);
}