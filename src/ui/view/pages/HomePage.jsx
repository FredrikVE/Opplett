import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {

    if (viewModel.loading) {
        return <p>Laster værmelding…</p>;
    }

    if (viewModel.error) {
        return <p>Feil: {viewModel.error}</p>;
    }

    return (
        <div className="home-screen">
            
            {/* Sideoverskrift */}
            <header className="page-header">
                <h1>Værmelding: {viewModel.location.name}</h1>
            </header>

            {/* Søkefelt */}
            <SearchField
                query={viewModel.query}
                suggestions={viewModel.suggestions}
                onSearchChange={viewModel.onSearchChange}
                onSuggestionSelected={viewModel.onSuggestionSelected}
            />

            {/* Farevarsler */}
            <AlertList alerts={viewModel.alerts} />

            {/* Soloppgang/solnedgang */}
            {/*
            <SolarInformation sunTimes={viewModel.sunTimes} />
            */}

            {/* Tabell med Dagkort */}
            <table className="forecast-overview-table">
                <thead>
                    <tr>
                    <th className="col-date" scope="col"></th>
                    <th className="col-period" scope="col">Natt</th>
                    <th className="col-period" scope="col">Morgen</th>
                    <th className="col-period" scope="col">Ettermiddag</th>
                    <th className="col-period" scope="col">Kveld</th>
                    </tr>
                </thead>

                {Object.entries(viewModel.forecast).map(([date, hourly]) => (
                    <DayForecastCard
                    key={date}
                    date={date}
                    hourly={hourly}
                    periods={viewModel.dailyPeriods[date]?.periods}
                    sunTimes={viewModel.sunTimesByDate?.[date]}
                    />
                ))}
            </table>

            
        </div>
    );
}
