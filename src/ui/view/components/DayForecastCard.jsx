// src/ui/view/components/DayForecastCard.jsx
import { useState } from "react";
import ForecastTable from "./ForecastTable.jsx";

export default function DayForecastCard({ date, forecast }) {
    const [open, setOpen] = useState(false);

    return (
        <section className="day-card">
            <button
                className="day-card-header"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <h2 className="day-card-date">{date}</h2>
                <span className="day-card-toggle">
                    {open ? "▲" : "▼"}
                </span>
            </button>

            {open && (
                <div className="day-card-content">
                    <ForecastTable forecast={forecast} />
                </div>
            )}
        </section>
    );
}
