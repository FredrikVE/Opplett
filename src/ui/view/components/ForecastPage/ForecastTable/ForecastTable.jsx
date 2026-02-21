//src/ui/view/components/HomePage/ForecastTable/ForecastTable.jsx
import { getWeatherIconFileName } from "../../../../utils/CommonUtils/weatherIcons.js";
import WindArrow from "../../Common/WindArrow/WindArrow.jsx";


const formatPrecipitation = (data) => {
	if (!data) {
		return "–";
	}

	const { amount, min, max } = data;

	if (min !== undefined && max !== undefined && min !== max) {
		return `${min} – ${max} mm`;
	}
	
	return `${amount} mm`;
};

export default function ForecastTable({ forecast }) {
	return (
		<table className="forecast-table">
			<thead>
				<tr>
					<th>Tid</th>
					<th>Temp</th>
					<th>UV</th>
					<th>Vind</th>
					<th>Nedbør</th>
					<th>Vær</th>
				</tr>
			</thead>

			<tbody>
				{forecast.map((item) => {

					//mapper data for hver time i tabellen
					const iconFile = getWeatherIconFileName(item.weatherSymbol);
					const gust = item.details?.wind_speed_of_gust;
					const windDir = item.details?.wind_from_direction;
					const p = item.precipitation;
					const tempClass = item.temp < 0 ? "is-minus" : "is-plus";	// Betinget klasse for temperaturfarge

					return (
						<tr key={`${item.dateISO}-${item.localTime}`}>
							
							<td className="time">{item.localTime}</td>

							{/* Temperatur med dynamisk klasse i stedet for style */}
							<td className={`temperature ${tempClass}`}>
								{Math.round(item.temp)} °C
							</td>
							
							<td>{item.uv ?? "–"}</td>

							<td className="wind">
								<div className="wind-container">
									<span>
										{Math.round(item.wind)}
										{gust != null && ` (${Math.round(gust)})`} m/s
									</span>
									<WindArrow degrees={windDir} size={16} />
								</div>
							</td>
							
							<td className="precipitation">
								{formatPrecipitation(p)}
							</td>

							<td className="weather-cell">
								{iconFile && (
									<img
										src={`/weather_icons/200/${iconFile}`}
										alt={item.weatherSymbol}
										className="weather-icon"
										loading="lazy"
									/>
								)}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}