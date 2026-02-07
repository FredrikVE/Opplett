import { useId } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

// Konstanter for tabell-overskrifter i GUI
const ORDER = ["symbolNight", "symbolMorning", "symbolAfternoon", "symbolEvening"];

//Oversett labels til norsk som er lettere å lese
const LABELS_NO = {
    symbolNight: "Natt",
    symbolMorning: "Morgen",
    symbolAfternoon: "Ettermiddag",
    symbolEvening: "Kveld",
};

//Chevron-ikon
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

/* Komponent */
export default function DayForecastCard({ date, hourly, summary, sunTimes, open, onToggle }) {
    const panelId = useId();

    const toggle = () => {
        onToggle();
    };

    // Rendrer ikon fra symbolkode til assoiert ikon
    const renderIcon = (periodKey) => {
        const symbolCode = summary?.[periodKey];
        
        if (!symbolCode) {
            return null;
        }

        const iconFile = getWeatherIconFileName(symbolCode);
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

    //Periode-celler (natt/morgen/ettermiddag/kveld)
    let periodCells;
    if (open) {
        periodCells = (
            <td className="day-card-periods-hidden" colSpan={4} />
        );
    } else {
        periodCells = ORDER.map((key) => (
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
        ));
    }

    //Bunn-chevron
    let bottomToggleRow = null;
    if (open) {
        bottomToggleRow = (
            <tr className="day-card-toggle-row">
                <td className="day-card-toggle-cell" colSpan={9}>
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
        );
    }

    return (
        <tbody className={`day-card-group ${open ? "is-open" : ""}`}>

            {/* TOPP: Sammendragsrad */}
            <tr className="day-card-summary-row">
                {/* Dato */}
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

                {/* Perioder */}
                {periodCells}

                {/* Temperatur høy / lav - Skjules når åpen */}
                <td className="day-card-cell-surface day-card-temp-cell">
                    {!open && summary ? (
                        <>
                            <strong
                                style={{
                                    color: summary.maxTemp < 0
                                        ? "var(--temperature-minus-color)"
                                        : "var(--temperature-plus-color)",
                                }}
                            >
                                {Math.round(summary.maxTemp)}°
                            </strong>
                            {" / "}
                            <span
                                style={{
                                    color: summary.minTemp < 0
                                        ? "var(--temperature-minus-color)"
                                        : "var(--temperature-plus-color)",
                                }}
                            >
                                {Math.round(summary.minTemp)}°
                            </span>
                        </>
                    ) : null}
                </td>

                {/* Nedbør - Skjules når åpen */}
                <td className="day-card-cell-surface day-card-precip-cell">
                    {!open && summary && summary.totalPrecip > 0
                        ? `${summary.totalPrecip.toFixed(1)} mm`
                        : null}
                </td>

                {/* Vind - Skjules når åpen */}
                <td className="day-card-cell-surface day-card-wind-cell">
                    {!open && summary
                        ? `${Math.round(summary.avgWind)} m/s`
                        : null}
                </td>

                {/* Chevron */}
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
                    colSpan={9}
                >
                    <div className="day-card-body-inner">
                        <ForecastTable forecast={hourly} />
                        <SolarInformation sunTimes={sunTimes} />
                    </div>
                </td>
            </tr>

            {/* BUNN */}
            {bottomToggleRow}

            {/* Spacer */}
            <tr className="day-card-spacer" aria-hidden="true">
                <td colSpan={9} />
            </tr>
        </tbody>
    );
}