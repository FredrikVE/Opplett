// src/ui/view/components/DayForecastCard.jsx
import { useState } from "react";
import ForecastTable from "./ForecastTable.jsx";

export default function DayForecastCard({ date, forecast }) {
    const [open, setOpen] = useState(false);

    return (
        <section className="day-card">
            <header
                className="day-card-header"
                onClick={() => setOpen(o => !o)}
                style={{ cursor: "pointer" }}
            >
                <h2>{date}</h2>
                <span>{open ? "▲" : "▼"}</span>
            </header>

            {open && <ForecastTable forecast={forecast} />}
        </section>
    );
}
