//src/ui/view/components/ForecastTable.jsx
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

export default function ForecastTable({ forecast }) {
    return (
        <table className="forecast-table">
            <thead>
                <tr>
                    <th>Tid</th>
                    <th>Temp</th>
                    <th>Vind</th>
                    <th>Nedbør</th>
                    <th>UV</th>
                    <th>Vær</th>
                </tr>
            </thead>

            <tbody>
                {forecast.map((item) => {
                    const wind = item.details.wind_speed;
                    const gust = item.details.wind_speed_of_gust;
                    const iconFile = getWeatherIconFileName(item.weatherSymbol);

                    return (
                        <tr key={`${item.date}-${item.localTime}`}>
                            <td className="time">{item.localTime}</td>

                            <td
                                className="temperature"
                                style={{
                                    color:
                                        item.details.air_temperature < 0
                                            ? "var(--temperature-minus-color)"
                                            : "var(--temperature-plus-color)",
                                }}
                            >
                                {item.details.air_temperature} °C
                            </td>

                            <td className="wind">
                                {wind}
                                {gust != null && ` (${gust})`} m/s
                            </td>

                            <td className="precipitation">
                                {item.details.precipitation_amount ?? 0} mm
                            </td>

                            <td>
                                {item.details.ultraviolet_index_clear_sky}
                            </td>

                            <td>
                                {iconFile && (
                                    <img
                                        src={`/weather_icons/200/${iconFile}`}
                                        alt={item.weatherSymbol}
                                        width={32}
                                        height={32}
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
