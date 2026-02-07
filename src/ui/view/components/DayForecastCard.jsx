//src/ui/view/components/DayForecastCard.jsx
import { useId } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

//Konstanter for tabell-overskrifter i GUI
const ORDER = ["symbolNight", "symbolMorning", "symbolAfternoon", "symbolEvening"];

//Oversett labels til norsk som er lettere å lese
const LABELS_NO = {
    symbolNight: "Natt",
    symbolMorning: "Morgen",
    symbolAfternoon: "Ettermiddag",
    symbolEvening: "Kveld",
};

//Chevron-ikon for å indikere åpning/lukking av kort.
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

export default function DayForecastCard({ date, hourly, summary, sunTimes, open, onToggle }) {
    const panelId = useId();

    const toggle = () => {
        onToggle();
    };

    // Håndter tastatur (Enter/Space) for tilgjengelighet
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

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

    // Periode-celler: Nå uten interne knapper
    let periodCells;
    if (open) {
        periodCells = <td className="day-card-periods-hidden" colSpan={4} />;
    } 
    
    else {
        periodCells = ORDER.map((key) => (
            <td key={key} className="day-card-cell-surface day-card-period-cell">
                {renderIcon(key)}
            </td>
        ));
    }

    // BUNN: Gjør hele cellen klikkbar
    let bottomToggleRow = null;
    if (open) {
        bottomToggleRow = (
            <tr 
                className="day-card-toggle-row" 
                onClick={toggle}
                style={{ cursor: 'pointer' }}
            >
                <td className="day-card-toggle-cell" colSpan={9}>
                    <div className="day-card-toggle">
                        <ChevronIcon className="up" style={{ transform: 'rotate(180deg)' }} />
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tbody className={`day-card-group ${open ? "is-open" : ""}`}>
            {/* TOPP: Hele raden er nå klikkbar */}
            <tr 
                className="day-card-summary-row"
                onClick={toggle}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-expanded={open}
                aria-controls={panelId}
                style={{ cursor: 'pointer' }}
            >
                {/* Dato */}
                <td className="day-card-cell-surface day-card-date-cell">
                    <h2 className="day-card-date">{date}</h2>
                </td>

                {/* Perioder */}
                {periodCells}

                {/* Temperatur, Nedbør, Vind - Nå bare tekst/data, ikke knapper */}
                <td className="day-card-cell-surface day-card-temp-cell">
                    {!open && summary && (
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
                    )}
                </td>

                <td className="day-card-cell-surface day-card-precip-cell">
                    {!open && summary && summary.totalPrecip > 0
                        ? `${summary.totalPrecip.toFixed(1)} mm`
                        : null}
                </td>

                <td className="day-card-cell-surface day-card-wind-cell">
                    {!open && summary
                        ? `${Math.round(summary.avgWind)} m/s`
                        : null}
                </td>

                {/* Chevron-celle */}
                <td className="day-card-cell-surface day-card-toggle-col">
                    <div className="day-card-disclosure">
                        <ChevronIcon className={open ? "open" : ""} />
                    </div>
                </td>
            </tr>

            {/* MIDT: Utvidet innhold (Klikk her vil IKKE lukke kortet, som er forventet) */}
            <tr className="day-card-body-row" hidden={!open}>
                <td id={panelId} className="day-card-body-cell" colSpan={9}>
                    <div className="day-card-body-inner">
                        <ForecastTable forecast={hourly} />
                        <SolarInformation sunTimes={sunTimes} />
                    </div>
                </td>
            </tr>

            {/* BUNN */}
            {bottomToggleRow}

            <tr className="day-card-spacer" aria-hidden="true">
                <td colSpan={9} />
            </tr>
        </tbody>
    );
}