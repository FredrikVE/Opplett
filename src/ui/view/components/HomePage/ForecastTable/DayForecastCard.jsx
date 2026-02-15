// src/ui/view/components/HomePage/ForecastTable/DayForecastCard.jsx
import { useId } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import AlertList from "../AlertCard/AlertList.jsx";
import { getWeatherIconFileName } from "../../../../utils/weatherIcons.js";
import { getAlertIconFileName } from "../../../../utils/getAlertIconFileName.js";

const ORDER = ["symbolNight", "symbolMorning", "symbolAfternoon", "symbolEvening"];

const LABELS_NO = {
    symbolNight: "Natt",
    symbolMorning: "Morgen",
    symbolAfternoon: "Ettermiddag",
    symbolEvening: "Kveld",
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

export default function DayForecastCard({ date, hourly, summary, sunTimes, open, onToggle, colCount, dayAlerts }) {
    const panelId = useId();
    const hasAlerts = dayAlerts.length > 0;

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
        return (
            <img
                //src={`/weather_icons/200/${iconFile}`}
                src={`/weather_icons/100/${iconFile}`}
                alt={LABELS_NO[periodKey]}
                width={28}
                height={28}
                loading="lazy"
            />
        );
    };

    // --- LOGIKK FOR LUKKET TILSTAND ---
    
    let alertIcon = null;
    if (!open && hasAlerts) {
        alertIcon = (
            <img 
                src={`/alert_symbols/128/${getAlertIconFileName(dayAlerts[0])}`} 
                alt="Farevarsel" 
                width="48" 
                height="48"
            />
        );
    }

    let periodCells = <td colSpan={ORDER.length} aria-hidden="true" />;
    if (!open) {
        periodCells = ORDER.map((key) => (
            <td key={key} className="day-card-cell-surface day-card-period-cell">
                <div className="icon-wrapper"> 
                    {renderIcon(key)}
                </div>
            </td>
        ));
    }

    let temperatureDisplay = null;
    if (!open && summary) {
        temperatureDisplay = (
            <div className="temp-container">
                <span className={`temp-max ${summary.maxTemp < 0 ? 'is-cold' : 'is-warm'}`}>
                    {Math.round(summary.maxTemp)}°
                </span>
                <span className="temp-divider"> / </span>
                <span className={`temp-min ${summary.minTemp < 0 ? 'is-cold' : 'is-warm'}`}>
                    {Math.round(summary.minTemp)}°
                </span>
            </div>
        );
    }

    let precipitationDisplay = null;
    if (!open && summary?.totalPrecip > 0) {
        precipitationDisplay = `${summary.totalPrecip.toFixed(1)} mm`;
    }

    let windDisplay = null;
    if (!open && summary) {
        windDisplay = `${Math.round(summary.avgWind)} m/s`;
    }

    // --- LOGIKK FOR EKSPANDERT TILSTAND ---
    let expandedRows = null;
    if (open) {
        expandedRows = (
            <>
                <tr className="day-card-body-row">
                    <td id={panelId} className="day-card-body-cell" colSpan={colCount}>
                        <div className="day-card-body-inner">
                            {hasAlerts && (
                                <div style={{ marginBottom: '16px' }}>
                                    <AlertList alerts={dayAlerts} />
                                </div>
                            )}
                            <ForecastTable forecast={hourly} />
                            <SolarInformation sunTimes={sunTimes} />
                        </div>
                    </td>
                </tr>

                <tr className="day-card-toggle-row clickable-row" onClick={onToggle}>
                    <td className="day-card-toggle-cell" colSpan={colCount}>
                        <div className="day-card-bottom-chevron">
                            <ChevronIcon />
                        </div>
                    </td>
                </tr>
            </>
        );
    }

    return (
        <tbody className={`day-card-group ${open ? "is-open" : ""}`}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 className="day-card-date">{date}</h2>
                        {alertIcon}
                    </div>
                </td>

                {periodCells}

                <td className="day-card-cell-surface day-card-temp-cell">
                    {temperatureDisplay}
                </td>

                <td className="day-card-cell-surface day-card-precip-cell day-card-precip">
                    {precipitationDisplay}
                </td>

                <td className="day-card-cell-surface day-card-wind-cell day-card-wind">
                    {windDisplay}
                </td>

                <td className="day-card-cell-surface day-card-toggle-col">
                    <div className="day-card-disclosure">
                        <ChevronIcon className={open ? "is-flipped" : ""} />
                    </div>
                </td>
            </tr>

            {expandedRows}
        </tbody>
    );
}