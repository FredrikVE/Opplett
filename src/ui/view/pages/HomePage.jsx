// src/ui/view/pages/HomePage.jsx
import { useState } from "react";
import SearchField from "../components/SearchField.jsx";
import DayForecastCard from "../components/DayForecastCard.jsx";
import AlertList from "../components/AlertList.jsx";

export default function HomePage({ viewModel }) {

	//state for å holde styr på åpne/lukkete kort
	const [openDate, setOpenDate] = useState(null);

	if (viewModel.loading) {
		return <p>Laster værmelding…</p>;
	}

	if (viewModel.error) {
		return <p>Feil: {viewModel.error}</p>;
	}
	
	const entries = Object.entries(viewModel.forecast); // Gjør forecast-objektet om til en liste som kan itereres
	const firstDate = entries[0]?.[0];                  // Datoen til første dag hvis den ikke er tom

	const toggleDate = (date) => {                      // Håndterer åpning og lukking av dagkort
		setOpenDate(previousDate => {
			if (previousDate === date) {
				return null;                            // Klikk på åpent kort -> lukk alle
			}

			return date;                                // Klikk på nytt kort -> åpne valgt dato
		});
	};

	const hideHeader = openDate === firstDate;           // Skjul tabell-header når første dag er åpen



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
						<th className="col-toggle" />
					</tr>
				</thead>
				)}

				{entries.map(([date, hourly], index) => (
					<DayForecastCard
						key={date}
						date={date}
						hourly={hourly}
						periods={viewModel.dailyPeriods[date]?.periods}
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
