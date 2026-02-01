import { useId } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";


//Hjelpefunksjoner
const ORDER = ["night", "morning", "afternoon", "evening"];

const LABELS_NO = {
	night: "Natt",
	morning: "Morgen",
	afternoon: "Ettermiddag",
	evening: "Kveld",
};

const ChevronIcon = ({ className = "" }) => (
	<svg
		className={`chevron ${className}`}
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<path
			d="M6 9l6 6 6-6"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

//Fuksjonskomponent som returerer et interaktivt kort med væremelding
export default function DayForecastCard({ date, hourly, periods, sunTimes, open, onToggle }) {
	const panelId = useId();

	const toggle = () => {
		onToggle();
	};

	const renderIcon = (periodKey) => {
		const period = periods?.[periodKey];
		if (!period) {
			return null;
		}

		const iconFile = getWeatherIconFileName(period.weatherSymbol);
		if (!iconFile) {
			return null;
		}

		return (
			<img
				src={`/weather_icons/200/${iconFile}`}
				alt={LABELS_NO[periodKey]}
				width={28}
				height={28}
				loading="lazy"
			/>
		);
	};

	return (
		<tbody className={`day-card-group ${open ? "is-open" : ""}`}>
			{/* TOPP: Sammendragsrad */}
			<tr className="day-card-summary-row">
				<td className="day-card-cell-surface day-card-date-cell">
					<button
						type="button"
						className="day-card-cell-button"
						onClick={toggle}
						aria-expanded={open}
						aria-controls={panelId}
					>
						<h2 className="day-card-date">{date}</h2>
					</button>
				</td>

				{/* Når åpen: skjul periode-ikonene */}
				{open ? (
					<td className="day-card-periods-hidden" colSpan={4} />
				) : (
					ORDER.map((key) => (
						<td
							key={key}
							className="day-card-cell-surface day-card-period-cell"
						>
							<button
								type="button"
								className="day-card-cell-button day-card-period-button"
								onClick={toggle}
								aria-label={`Vis detaljer for ${LABELS_NO[key]}`}
								aria-expanded={open}
								aria-controls={panelId}
							>
								{renderIcon(key)}
							</button>
						</td>
					))
				)}

				{/* Chevron-kolonne */}
				<td className="day-card-cell-surface day-card-toggle-col">
					<button
						type="button"
						className="day-card-disclosure"
						onClick={toggle}
						aria-expanded={open}
						aria-controls={panelId}
						aria-label={open ? "Skjul detaljer" : "Vis detaljer"}
					>
						<ChevronIcon />
					</button>
				</td>
			</tr>

			{/* MIDT: Utvidet innhold */}
			<tr className="day-card-body-row" hidden={!open}>
				<td
					id={panelId}
					className="day-card-body-cell"
					colSpan={6}
				>
					<div className="day-card-body-inner">
						<ForecastTable forecast={hourly} />
						<SolarInformation sunTimes={sunTimes} />
					</div>
				</td>
			</tr>

			{/* BUNN: Chevron (kun når åpen) */}
			{open && (
				<tr className="day-card-toggle-row">
					<td className="day-card-toggle-cell" colSpan={6}>
						<button
							type="button"
							className="day-card-toggle"
							onClick={toggle}
							aria-expanded={open}
							aria-controls={panelId}
							aria-label="Skjul detaljer"
						>
							<ChevronIcon />
						</button>
					</td>
				</tr>
			)}

			{/* Spacer */}
			<tr className="day-card-spacer" aria-hidden="true">
				<td colSpan={6} />
			</tr>
		</tbody>
	);
}
