// src/ui/view/pages/HomePage.jsx
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {

    const [openDate, setOpenDate] = useState(null);

    if (viewModel.loading) {
        return <LoadingSpinner/>;
    }

    if (viewModel.error) {
        return <p>Feil: {viewModel.error}</p>;
    }
    
    const entries = Object.entries(viewModel.forecast); 
    const firstDate = entries[0]?.[0];                  

    const toggleDate = (date) => {                      
        setOpenDate(previousDate => {
            if (previousDate === date) {
                return null;                            
            }
            return date;                                
        });
    };

    const hideHeader = openDate === firstDate;           

    return (
        <div className="home-screen">
            <header className="page-header">
                <h1>Værmelding: {viewModel.location.name}</h1>
            </header>

            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
            />

            <AlertList alerts={viewModel.alerts} />

            <table className="forecast-overview-table">
                {!hideHeader && (
                <thead>
                    <tr>
                        <th className="col-date" />
                        <th className="col-period">Natt</th>
                        <th className="col-period">Morgen</th>
                        <th className="col-period">Ettermiddag</th>
                        <th className="col-period">Kveld</th>
                        <th className="col-temp">Temp høy/lav</th>
                        <th className="col-precip">Nedbør</th>
                        <th className="col-wind">Vind</th>
                        <th className="col-toggle" />
                    </tr>
                </thead>
                )}

                {entries.map(([date, hourly], index) => (
                    <DayForecastCard
                        key={date}
                        date={date}
                        hourly={hourly}
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