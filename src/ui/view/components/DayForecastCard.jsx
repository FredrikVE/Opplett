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
                        
                        if (!icon) {
                            return null;
                        }

                        const label =
                            key === "night" ? "Natt" :
                            key === "morning" ? "Morgen" :
                            key === "afternoon" ? "Dag" :
                            key === "evening" ? "Kveld" : key;

                        return (
                        <div className="day-card-period" key={key}>
                            <img
                            src={`/weather_icons/200/${icon}`}
                            alt={label}
                            title={label}
                            width={28}
                            height={28}
                            loading="lazy"
                            />
                            <span className="day-card-period-label">{label}</span>
                        </div>
                        );
                    })}
                </div>

                <span className="day-card-toggle" aria-hidden="true">
                    <svg
                        className="chevron"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        />
                    </svg>
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
