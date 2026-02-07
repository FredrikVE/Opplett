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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    const renderIcon = (periodKey) => {
        const symbolCode = summary?.[periodKey];
        if (!symbolCode) return null;
        const iconFile = getWeatherIconFileName(symbolCode);
        if (!iconFile) return null;

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
            {/* TOPP: Klikkbar rad */}
            <tr 
                className="day-card-summary-row clickable-row"
                onClick={onToggle}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-expanded={open}
                aria-controls={panelId}
            >
                <td className="day-card-cell-surface day-card-date-cell">
                    <h2 className="day-card-date">{date}</h2>
                </td>

                {/* Perioder */}
                {!open ? (
                    ORDER.map((key) => (
                        <td key={key} className="day-card-cell-surface day-card-period-cell">
                            <div className="icon-wrapper">
                                {renderIcon(key)}
                            </div>
                        </td>
                    ))
                ) : (
                    <td className="day-card-periods-hidden" colSpan={4} />
                )}

                {/* Info-celler */}
                <td className="day-card-cell-surface day-card-temp-cell">
                    {!open && summary && (
                        <div className="temp-container">
                            <span className={`temp-max ${summary.maxTemp < 0 ? 'is-cold' : 'is-warm'}`}>
                                {Math.round(summary.maxTemp)}°
                            </span>
                            <span className="temp-divider"> / </span>
                            <span className={`temp-min ${summary.minTemp < 0 ? 'is-cold' : 'is-warm'}`}>
                                {Math.round(summary.minTemp)}°
                            </span>
                        </div>
                    )}
                </td>

                {/* NEDBØR: Lagt til klassen day-card-precip */}
                <td className="day-card-cell-surface day-card-precip-cell day-card-precip">
                    {!open && summary && summary.totalPrecip > 0 ? `${summary.totalPrecip.toFixed(1)} mm` : null}
                </td>

                {/* VIND: Lagt til klassen day-card-wind */}
                <td className="day-card-cell-surface day-card-wind-cell day-card-wind">
                    {!open && summary ? `${Math.round(summary.avgWind)} m/s` : null}
                </td>

                <td className="day-card-cell-surface day-card-toggle-col">
                    <div className="day-card-disclosure">
                        <ChevronIcon />
                    </div>
                </td>
            </tr>

            {/* MIDT: Innhold */}
            <tr className="day-card-body-row" hidden={!open}>
                <td id={panelId} className="day-card-body-cell" colSpan={9}>
                    <div className="day-card-body-inner">
                        <ForecastTable forecast={hourly} />
                        <SolarInformation sunTimes={sunTimes} />
                    </div>
                </td>
            </tr>

            {/* BUNN: Klikkbar lukkeknapp */}
            {open && (
                <tr className="day-card-toggle-row clickable-row" onClick={onToggle}>
                    <td className="day-card-toggle-cell" colSpan={9}>
                        <div className="day-card-bottom-chevron">
                            <ChevronIcon />
                        </div>
                    </td>
                </tr>
            )}

        </tbody>
    );
}