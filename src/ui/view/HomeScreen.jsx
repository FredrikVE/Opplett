// src/ui/view/HomeScreen.jsx
import { getWeatherIconFileName } from "../utils/weatherIcons";

export default function HomeScreen({ viewModel }) {

    // Destructer props-parameter
    const { forecast, sunTimes, loading, error, query, suggestions, onSearchChange, onSuggestionSelected, location } = viewModel;

    if (loading) {
        return <p>Laster værmelding…</p>;
    }

    if (error) {
        return <p>Feil: {error}</p>;
    }

    const date = forecast.length > 0 ? forecast[0].date : "";

    return (
        <div>
            {/* Overskrift */}
            <h1>
                Værmelding {location?.name ? `– ${location.name}` : ""}
            </h1>

            {/* Søkefelt */}
            <div className="search">
                <input
                    type="text"
                    placeholder="Søk sted, by eller adresse…"
                    value={query}
                    onChange={(e) => onSearchChange(e.target.value)}
                />

                {suggestions.length > 0 && (
                    <ul className="search-suggestions">
                        {suggestions.map((s) => (
                            <li
                                key={`${s.lat}-${s.lon}`}
                                onClick={() => onSuggestionSelected(s)}
                            >
                                {s.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <h2>{date && date}</h2>

            {/* Soloppgang/solnedgang */}
            {sunTimes && (
                <div className="sun-times">
                    <span>Soloppgang: {sunTimes.sunrise}</span>
                    <span>Solnedgang: {sunTimes.sunset}</span>
                </div>
            )}

            {/* Værvarsel  */}
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
                        const iconFile =
                            getWeatherIconFileName(item.weatherSymbol);

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

                                <td className="weather-icon">
                                    <img
                                        src={`/weather_icons/200/${iconFile}`}
                                        alt={item.weatherSymbol}
                                        width={32}
                                        height={32}
                                        loading="lazy"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
