import { useId } from "react";
import { getWeatherIconFileName } from "../../../../utils/CommonUtils/weatherIcons.js";
import { getAlertIconFileName } from "../../../../utils/CommonUtils/getAlertIconFileName.js";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import AlertList from "../../Common/AlertCard/AlertList.jsx";
import ChevronIcon from "../../Common/Buttons/ChevronIcon.jsx";

const ORDER = ["symbolNight", "symbolMorning", "symbolAfternoon", "symbolEvening"];

const LABELS_NO = {
    symbolNight: "Natt",
    symbolMorning: "Morgen",
    symbolAfternoon: "Ettermiddag",
    symbolEvening: "Kveld",
};

export default function DayForecastCard({ date, hourly, summary, sunTimes, isOpen, onToggle, colCount, dayAlerts, formatLocalDateTime }) {
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
        if (!symbolCode) {
            return null;
        }
        
        const iconFile = getWeatherIconFileName(symbolCode);
        return (
            <img
                src={`/weather_icons/100/${iconFile}`}
                alt={LABELS_NO[periodKey]}
                className="day-card-period-icon"
                loading="lazy"
            />
        );
    };

    //Logikk for kortets lukkete tilstand
    let alertIcons = null;
    if (!isOpen && hasAlerts) {
        alertIcons = (
            <div className="day-card-alert-stack">
                {dayAlerts.map((alert, index) => (
                    <img 
                        key={alert.id || index}
                        src={`/alert_symbols/128/${getAlertIconFileName(alert)}`} 
                        alt="Farevarsel" 
                        className="day-card-alert-badge-stacked"
                        style={{ zIndex: dayAlerts.length - index }}
                    />
                ))}
            </div>
        );
    }

    let periodCells = <td colSpan={ORDER.length} aria-hidden="true" />;
    if (!isOpen) {
        periodCells = ORDER.map((key) => (
            <td key={key} className="day-card-cell-surface day-card-period-cell">
                <div className="icon-wrapper"> 
                    {renderIcon(key)}
                </div>
            </td>
        ));
    }

    let temperatureDisplay = null;
    if (!isOpen && summary) {
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
    if (!isOpen && summary?.totalPrecip > 0) {
        precipitationDisplay = `${summary.totalPrecip.toFixed(1)} mm`;
    }

    let windDisplay = null;
    if (!isOpen && summary) {
        windDisplay = `${Math.round(summary.avgWind)} m/s`;
    }

    //Logikk for kortets åpne tilstand
    let expandedRows = null;
    if (isOpen) {
        expandedRows = (
            <>
                <tr className="day-card-body-row">
                    <td id={panelId} className="day-card-body-cell" colSpan={colCount}>
                        <div className="day-card-body-inner">
                            
                            {/* Alertlist */}
                            {hasAlerts && (                    
                                <AlertList 
                                    alerts={dayAlerts} 
                                    formatLocalDateTime={formatLocalDateTime} />
                                )
                            }

                            {/*ForecastTable */}
                            <ForecastTable forecast={hourly} />
                            
                            {/*SunTimes */}
                            <SolarInformation sunTimes={sunTimes} />
                        </div>
                    </td>
                </tr>

                <tr className="day-card-toggle-row clickable-row" onClick={onToggle}>
                    <td className="day-card-toggle-cell" colSpan={colCount}>
                        <div className="day-card-bottom-chevron">
                            <ChevronIcon 
                                isOpen={isOpen}
                                className="" 
                                size={20}
                            />
                        </div>
                    </td>
                </tr>
            </>
        );
    }

    return (
        <tbody className={`day-card-group ${isOpen ? "is-open" : ""}`}>
            <tr 
                className="day-card-summary-row clickable-row"
                onClick={onToggle}
                onKeyDown={handleKeyDown}
                tabIndex="0"
                role="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
            >
                <td className="day-card-cell-surface day-card-date-cell">
                    <div className="day-card-header">
                        <h2 className="day-card-date">{date}</h2>
                        {alertIcons}
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
                        <ChevronIcon 
                            isOpen={isOpen}
                            className="" 
                            size={20}
                            />
                    </div>
                </td>
            </tr>
            {expandedRows}
        </tbody>
    );
}