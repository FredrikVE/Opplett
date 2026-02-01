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

  // Finn "første" dato i forecast-lista (den som vises øverst)
  const entries = Object.entries(viewModel.forecast);
  const firstDate = entries.length > 0 ? entries[0][0] : null;

  // Skjul kun kolonne-overskriftene hvis første kort er åpent
  const hideHeader = openDate !== null && openDate === firstDate;

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
        {/* Skjul kolonne-overskrifter kun når første dagkort er åpent */}
        {!hideHeader && (
          <thead>
            <tr>
              <th className="col-date" scope="col"></th>
              <th className="col-period" scope="col">Natt</th>
              <th className="col-period" scope="col">Morgen</th>
              <th className="col-period" scope="col">Ettermiddag</th>
              <th className="col-period" scope="col">Kveld</th>
              <th className="col-toggle" scope="col"></th>
            </tr>
          </thead>
        )}

        {entries.map(([date, hourly], index) => (
          <DayForecastCard
            key={date}
            date={date}
            hourly={hourly}
            periods={viewModel.dailyPeriods[date]?.periods}
            sunTimes={viewModel.sunTimesByDate?.[date]}
            open={openDate === date}
            onToggle={() => toggleDate(date)}
            isFirst={index === 0}
          />
        ))}
      </table>
    </div>
  );
}
