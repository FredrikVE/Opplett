//src/ui/view/components/HomePage/ForecastTable/ForecastTable.jsx
import { getWeatherIconFileName } from "../../../../utils/CommonUtils/weatherIcons.js";

const formatPrecipitation = (data) => {
    if (!data) {
        return "–";
    }

    const { amount, min, max } = data;

    // Hvis det er et intervall (min og max er forskjellige)
    if (min !== undefined && max !== undefined && min !== max) {
        return `${min} – ${max} mm`;
    }
    // Ellers vanlig mengde (f.eks. "0 mm" eller "1.2 mm")
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
                    const iconFile = getWeatherIconFileName(item.weatherSymbol);
                    const gust = item.details?.wind_speed_of_gust;
                    const p = item.precipitation;

                    return (
                        <tr key={`${item.date}-${item.localTime}`}>
                            
                            {/* Klokkeslett */}
                            <td className="time">{item.localTime}</td>

                            {/* Temperatur */}
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
                            
                            {/* UV */}
                            <td>{item.uv ?? "–"}</td>

                            {/* Vind */}
                            <td className="wind">
                                {Math.round(item.wind)}
                                {gust != null && ` (${Math.round(gust)})`} m/s
                            </td>
                            
                            {/* Nedbør */}
                            <td className="precipitation">
                                {formatPrecipitation(p)}
                                {p.isPeriod}
                            </td>

                            {/* Værikon */}
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