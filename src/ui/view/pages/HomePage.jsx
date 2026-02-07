// src/ui/view/pages/HomePage.jsx
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {
    const [openDate, setOpenDate] = useState(null);

    // 1. Definer tabellstrukturen ett sted
    const tableConfig = [
        { id: "date", label: "" },
        { id: "night", label: "Natt" },
        { id: "morning", label: "Morgen" },
        { id: "afternoon", label: "Ettermiddag" },
        { id: "evening", label: "Kveld" },
        { id: "temp", label: "Temp høy/lav" },
        { id: "precip", label: "Nedbør" },
        { id: "wind", label: "Vind" },
        { id: "toggle", label: "" }
    ];

    const colCount = tableConfig.length;

    if (viewModel.loading) {
        return <LoadingSpinner />;
    }

    if (viewModel.error) {
        return <p>Feil: {viewModel.error}</p>;
    }

    const entries = Object.entries(viewModel.forecast);
    const firstDate = entries[0]?.[0];

    const toggleDate = (date) => {
        setOpenDate((previousOpenDate) => {
            if (previousOpenDate === date) { // Hvis datoen vi klikket på allerede er den som er åpen
                return null;                 // returnerer vi null (lukk kortet)
            } 
            else {
                return date;                // ellers returnerer vi den nye datoen (åpne det nye kortet)
            }
        });
    };

    // Skjul header hvis det første kortet er åpent
    const hideHeader = openDate === firstDate;

    return (
        <div className="home-screen">
            <header className="page-header">
                <h1>Værmelding: {viewModel.location.name || "Min posisjon"}</h1>
            </header>

            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
                onResetToDeviceLocation={viewModel.onResetToDeviceLocation} // Lagt til her
            />

            <AlertList alerts={viewModel.alerts} />

            <table className="forecast-overview-table">
                {!hideHeader && (
                    <thead>
                        <tr>
                            {tableConfig.map((col) => (
                                <th key={col.id} className={`col-${col.id}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}

                {entries.map(([date, hourly], index) => (
                    <DayForecastCard
                        key={date}
                        date={date}
                        hourly={hourly}
                        colCount={colCount}
                        summary={viewModel.dailySummaryByDate[date]}
                        sunTimes={viewModel.sunTimesByDate[date]}
                        open={openDate === date}
                        isFirst={index === 0}
                        onToggle={() => toggleDate(date)}
                    />
                ))}
            </table>
        </div>
    );
}