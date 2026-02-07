// src/ui/view/components/ForecastTable.jsx
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
                    // Vi bruker verdiene vi flater ut i LocationForecastRepository
                    const wind = item.wind;
                    // Gust ligger fremdeles i den rå details-blokken
                    const gust = item.details?.wind_speed_of_gust;
                    const iconFile = getWeatherIconFileName(item.weatherSymbol);
                    const uvIndex = item.details?.ultraviolet_index_clear_sky;

                    return (
                        <tr key={`${item.date}-${item.localTime}`}>
                            {/* Viser tidspunkt som f.eks "14" */}
                            <td className="time">{item.localTime}</td>

                            <td
                                className="temperature"
                                style={{
                                    color:
                                        item.temp < 0
                                            ? "var(--temperature-minus-color)"
                                            : "var(--temperature-plus-color)",
                                }}
                            >
                                {Math.round(item.temp)} °C
                            </td>

                            <td className="wind">
                                {Math.round(wind)}
                                {gust != null && ` (${Math.round(gust)})`} m/s
                            </td>

                            <td className="precipitation">
                                {/* Viser nedbør for den spesifikke timen */}
                                {item.oneHourPrecip ?? 0} mm
                            </td>

                            <td>
                                {uvIndex ?? "–"}
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