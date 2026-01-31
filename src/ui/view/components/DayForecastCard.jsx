// src/ui/view/components/DayForecastCard.jsx
import { useState } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx"
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

export default function DayForecastCard({ date, hourly, periods, sunTimes }) {
    const [open, setOpen] = useState(false);

    return (
        <section className="day-card">

            <button
                className="day-card-header"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <h2 className="day-card-date">{date}</h2>

                {/* Oppsummeringsikoner */}
                <div className="day-card-periods">
                    {periods && Object.entries(periods).map(([key, p]) => {
                        const icon = getWeatherIconFileName(p.weatherSymbol);
                        return icon ? (
                            <img
                                key={key}
                                src={`/weather_icons/200/${icon}`}
                                alt={key}
                                title={key}
                                width={28}
                                height={28}
                            />
                        ) : null;
                    })}
                </div>

                <span className="day-card-toggle">
                    {open ? "▲" : "▼"}
                </span>
            </button>

            {open && (
                <div className="day-card-content">
                    <ForecastTable forecast={hourly} />
                    <SolarInformation sunTimes={sunTimes} />
                </div>
            )}
        </section>
    );
}
