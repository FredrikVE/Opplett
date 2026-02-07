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
                    const wind = item.wind;
                    const gust = item.details?.wind_speed_of_gust;
                    const iconFile = getWeatherIconFileName(item.weatherSymbol);
                    const uvIndex = item.details?.ultraviolet_index_clear_sky;

                    // EKSPLISITT NEDBØRSLOGIKK
                    let precipDisplay = "–";
                    let isLongTerm = false;

                    // 1. Sjekk om vi har timesvarsel (prioriteres alltid)
                    if (item.oneHourPrecip !== undefined) {
                        precipDisplay = `${item.oneHourPrecip} mm`;
                    } 
                    // 2. Hvis ikke, sjekk om vi har 6-timersvarsel med faktisk nedbør
                    else if (item.sixHourPrecip > 0) {
                        precipDisplay = `${item.sixHourPrecip} mm`;
                        isLongTerm = true;
                    }

                    return (
                        <tr key={`${item.date}-${item.localTime}`}>
                            <td className="time">{item.localTime}</td>

                            <td
                                className="temperature"
                                style={{
                                    color: item.temp < 0
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
                                {precipDisplay}
                                {isLongTerm && <small style={{ display: 'block', fontSize: '0.7em' }}>/6t</small>}
                            </td>

                            <td>{uvIndex ?? "–"}</td>

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