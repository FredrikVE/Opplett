import { useState } from "react";
import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {
  const [openDate, setOpenDate] = useState(null);

  if (viewModel.loading) return <p>Laster værmelding…</p>;
  if (viewModel.error) return <p>Feil: {viewModel.error}</p>;

  const toggleDate = (date) => {
    setOpenDate((prev) => (prev === date ? null : date));
  };

  const anyOpen = openDate !== null;

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
        {/* Skjul kolonne-overskrifter når et dagkort er åpent */}
        {!anyOpen && (
          <thead>
            <tr>
              <th className="col-date" scope="col"></th>
              <th className="col-period" scope="col">Natt</th>
              <th className="col-period" scope="col">Morgen</th>
              <th className="col-period" scope="col">Ettermiddag</th>
              <th className="col-period" scope="col">Kveld</th>
            </tr>
          </thead>
        )}

        {Object.entries(viewModel.forecast).map(([date, hourly]) => (
          <DayForecastCard
            key={date}
            date={date}
            hourly={hourly}
            periods={viewModel.dailyPeriods[date]?.periods}
            sunTimes={viewModel.sunTimesByDate?.[date]}
            open={openDate === date}
            onToggle={() => toggleDate(date)}
          />
        ))}
      </table>
    </div>
  );
}
