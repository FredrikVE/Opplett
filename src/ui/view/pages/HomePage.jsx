import { useState } from "react";
import Navigation from "../../../navigation/Navigation.jsx";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner.jsx";
import SearchField from "../components/HomePage/SearchFeild/SearchField.jsx";
import DayForecastCard from "../components/HomePage/ForecastTable/DayForecastCard.jsx";
import NowCard from "../components/HomePage/NowCard/NowCard.jsx";

export default function HomePage({ viewModel, activeScreen, onChangeScreen, SCREENS }) {

	const [openDate, setOpenDate] = useState(null);

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

	const entries = Object.entries(viewModel.forecast);
	const firstDate = entries[0]?.[0];

	const toggleDate = (dateISO) => {
		setOpenDate((prev) => (
			prev === dateISO ? null : dateISO
		));
	};

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

			<Navigation
				activeScreen={activeScreen}
				onChangeScreen={onChangeScreen}
				SCREENS={SCREENS}
			/>

			{viewModel.currentWeather && (
				<NowCard
					current={viewModel.currentWeather}
					alerts={viewModel.alerts}
				/>
			)}

			<main className="content-area">
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
							isOpen={openDate === dateISO}
							isFirst={index === 0}
							onToggle={() => toggleDate(dateISO)}
							dayAlerts={viewModel.alertsByDate[dateISO] || []}
							formatLocalDateTime={viewModel.formatLocalDateTime}
						/>
					))}
				</table>
			</main>
		</div>
	);
}
