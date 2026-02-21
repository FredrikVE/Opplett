// src/ui/view/components/HomePage/ForecastTable/ForecastTable.jsx
import { getWeatherIconFileName } from "../../../../utils/CommonUtils/weatherIcons.js";
import { getWindSpeedDescription, getWindDirectionText } from "../../../../utils/WindUtils/windDescriptionUtil.js";
import WindArrow from "../../Common/WindArrow/WindArrow.jsx";

const formatPrecipitation = (data) => {
    if (!data) return "–";
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
                    <th>Vær</th>
                    <th>Temp</th>
                    <th>Nedbør</th>
                    <th>Vind</th>
                    <th>Vindbeskrivelse</th>
                </tr>
            </thead>

            <tbody>
                {forecast.map((item) => {
                    const iconFile = getWeatherIconFileName(item.weatherSymbol);
                    const windSpeed = item.wind;
                    const gust = item.details?.wind_speed_of_gust;
                    const windDir = item.details?.wind_from_direction;

                    // Generer beskrivelsen basert på SNL-definisjoner
                    const windDesc = getWindSpeedDescription(windSpeed);
                    const dirText = getWindDirectionText(windDir);
                    const fullDesc = `${windDesc} fra ${dirText}${
                        gust > windSpeed ? ` med vindkast på ${Math.round(gust)} m/s` : ""
                    }`;

                    return (
                        <tr key={`${item.dateISO}-${item.localTime}`}>
                            <td className="time">{item.localTime}</td>
                            
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

                            <td className={`temperature ${item.temp < 0 ? 'is-minus' : 'is-plus'}`}>
                                {Math.round(item.temp)}°
                            </td>
                            
                            <td className="precipitation">
                                {formatPrecipitation(item.precipitation)}
                            </td>

                            <td className="wind">
                                <div className="wind-container">
                                    <span>
                                        {Math.round(windSpeed)}
                                        {gust != null && ` (${Math.round(gust)})`}
                                    </span>
                                    <WindArrow degrees={windDir} size={16} />
                                </div>
                            </td>

                            <td className="wind-description">
                                {fullDesc}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}