// src/ui/view/pages/HomePage.jsx
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import SearchField from "../components/HomePage/SearchFeild/SearchField.jsx";
import DayForecastCard from "../components/HomePage/ForecastTable/DayForecastCard.jsx";
import NowCard from "../components/HomePage/NowCard/NowCard.jsx";
import WeatherGraph from "../components/HomePage/Graph/WeatherGraph.jsx";
import WindGraph from "../components/HomePage/Graph/WindGraph.jsx";
import SunGraph from "../components/HomePage/Graph/SunGraph.jsx";
import UVGraph from "../components/HomePage/Graph/UVGraph.jsx";
import AlertList from "../components/HomePage/AlertCard/AlertList.jsx";

export default function HomePage({ viewModel }) {

    // States for UI-mekanikk
    const [openDate, setOpenDate] = useState(null);
    const [viewMode, setViewMode] = useState("table");

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
        return <p className="error-message">Feil: {viewModel.error}</p>;
    }

    // Konverterer forecast-objektet til en liste for mapping
    const entries = Object.entries(viewModel.forecast);
    const firstDate = entries[0]?.[0]; // ISO-streng (f.eks. "2026-02-14")
    
    // Data til grafen (neste 48 timer)
    const allHourlyData = entries.flatMap(([, dayData]) => dayData.hours).slice(0, 48);

    const toggleDate = (dateISO) => {
        setOpenDate((prev) => (prev === dateISO ? null : dateISO));
    };

    const handleViewChange = (mode) => {
        setViewMode(mode);
        if (mode === "graph") {
            setOpenDate(null); // Lukker ekspanderte rader i tabellen
        }
    };

    // Skjuler headeren hvis det første kortet er ekspandert
    const hideHeader = openDate === firstDate;

    return (
        <div className="home-screen">
            <header className="page-header">
                <h1>{viewModel.location.name || "Min posisjon"}</h1>
            </header>

            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
                onResetToDeviceLocation={viewModel.onResetToDeviceLocation}
            />

            {/* Now card - bruker den flate viewModel.alerts listen for nå-situasjonen */}
            {viewMode === "table" && viewModel.currentWeather && (
                <NowCard current={viewModel.currentWeather} alerts={viewModel.alerts} />
            )}

            {/* Bryter mellom Tabell og Graf */}
            <div className="view-mode-selector">
                <div className="toggle-container">
                    <button 
                        className={viewMode === "table" ? "active" : ""} 
                        onClick={() => handleViewChange("table")}
                    >
                        Tabell
                    </button>
                    <button 
                        className={viewMode === "graph" ? "active" : ""} 
                        onClick={() => handleViewChange("graph")}
                    >
                        Graf
                    </button>
                </div>
            </div>

            <main className="content-area">
                {viewMode === "graph" ? (
                    
                    /* GRAF-VISNING */
                    <section className="meteogram-section">
                        <WeatherGraph
                            hourlyData={allHourlyData}
                            getLocalHour={viewModel.getLocalHour}
                            formatLocalDate={viewModel.formatLocalDate}
                        />

                        <WindGraph
                            hourlyData={allHourlyData}
                            getLocalHour={viewModel.getLocalHour}
                            formatLocalDate={viewModel.formatLocalDate}
                        />

                         <UVGraph
                            hourlyData={allHourlyData}
                            getLocalHour={viewModel.getLocalHour}
                            formatLocalDate={viewModel.formatLocalDate}
                        />

                        <SunGraph 
                            sunTimesByDate={viewModel.sunTimesByDate} 
                            formatLocalDate={viewModel.formatLocalDate}
                        />
                    </section>
                ) : (
                    /* TABELL-VISNING */
                    <table className="forecast-overview-table">
                        <thead className={hideHeader ? "visual-hide" : ""}>
                            <tr className="table-header-row">
                                {tableConfig.map((col) => (
                                    <th key={col.id} className={`col-${col.id}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {entries.map(([dateISO, dayData], index) => (
                            <DayForecastCard
                                key={dateISO}
                                date={dayData.label}
                                hourly={dayData.hours}
                                colCount={colCount}
                                summary={viewModel.dailySummaryByDate[dateISO]}
                                sunTimes={viewModel.sunTimesByDate[dateISO]}
                                open={openDate === dateISO}
                                isFirst={index === 0}
                                onToggle={() => toggleDate(dateISO)}
                                dayAlerts={viewModel.alertsByDate[dateISO] || []} 
                            />
                        ))}
                    </table>
                )}
            </main>
        </div>
    );
}