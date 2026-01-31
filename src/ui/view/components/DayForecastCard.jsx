// src/ui/view/components/DayForecastCard.jsx
import { useState } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx"
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

export default function DayForecastCard({ date, hourly, periods, sunTimes }) {
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen(o => !o);

    return (
        <section className={`day-card ${open ? "is-open" : ""}`}>

        <button
            className="day-card-header"
            onClick={toggle}
            aria-expanded={open}
        >
            <h2 className="day-card-date">{date}</h2>

            <div className="day-card-periods">
            {periods && Object.entries(periods).map(([key, p]) => {
                const icon = getWeatherIconFileName(p.weatherSymbol);
                if (!icon) return null;

                return (
                <div className="day-card-period" key={key}>
                    <img
                    src={`/weather_icons/200/${icon}`}
                    alt={key}
                    width={28}
                    height={28}
                    loading="lazy"
                    />
                    <span className="day-card-period-label">{key}</span>
                </div>
                );
            })}
            </div>
        </button>

        {/* "Usynlig rad" / overlay-knapp med chevron */}
        <button
            className="day-card-toggle-row"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "Skjul detaljer" : "Vis detaljer"}
        >
            <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            </svg>
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
