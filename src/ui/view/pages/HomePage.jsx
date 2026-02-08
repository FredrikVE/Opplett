import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {
    const [openDate, setOpenDate] = useState(null);

    // Tabellstruktur
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

    // Konverterer forecast-objektet til en liste for mapping
    const entries = Object.entries(viewModel.forecast);
    const firstDate = entries[0]?.[0]; // Dette vil nå være en ISO-streng (f.eks. "2026-02-08")

    const toggleDate = (dateISO) => {
        setOpenDate((prev) => (prev === dateISO ? null : dateISO));
    };

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
                onResetToDeviceLocation={viewModel.onResetToDeviceLocation}
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

                {/* Hver 'entry' består av [key, value]
                    dateISO = "2026-02-08" (ID brukt for oppslag)
                    dayData = { label: "Søndag 8. feb", hours: [...] } (Data for visning)
                */}
                {entries.map(([dateISO, dayData], index) => (
                    <DayForecastCard
                        key={dateISO}
                        date={dayData.label}          // Sender den pene teksten
                        hourly={dayData.hours}        // Sender listen med timer
                        colCount={colCount}
                        summary={viewModel.dailySummaryByDate[dateISO]} // Bruker stabil ISO-nøkkel
                        sunTimes={viewModel.sunTimesByDate[dateISO]}    // Bruker stabil ISO-nøkkel
                        open={openDate === dateISO}
                        isFirst={index === 0}
                        onToggle={() => toggleDate(dateISO)}
                    />
                ))}
            </table>
        </div>
    );
}