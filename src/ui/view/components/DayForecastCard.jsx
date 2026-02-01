import { useId } from "react";
import ForecastTable from "./ForecastTable.jsx";
import SolarInformation from "./SolarInformation.jsx";
import { getWeatherIconFileName } from "../../utils/weatherIcons.js";

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

export default function DayForecastCard({
  date,
  hourly,
  periods,
  sunTimes,
  open,
  onToggle,
}) {
  const panelId = useId();
  const toggle = () => onToggle?.();

  const renderIcon = (key) => {
    const p = periods?.[key];
    const icon = p ? getWeatherIconFileName(p.weatherSymbol) : null;
    if (!icon) return null;

    return (
      <img
        src={`/weather_icons/200/${icon}`}
        alt={LABELS_NO[key]}
        width={28}
        height={28}
        loading="lazy"
      />
    );
  };

  return (
    <tbody className={`day-card-group ${open ? "is-open" : ""}`}>
      {/* TOPP: Summary-rad */}
      <tr className="day-card-summary-row">
        <td className="day-card-cell-surface day-card-date-cell">
          <button
            className="day-card-cell-button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            type="button"
          >
            <h2 className="day-card-date">{date}</h2>
          </button>
        </td>

        {/* Når åpen: IKKE vis 6-timers-ikonene (gjelder ALLE åpne kort) */}
        {open ? (
          <td className="day-card-periods-hidden" colSpan={4} />
        ) : (
          ORDER.map((key) => (
            <td key={key} className="day-card-cell-surface day-card-period-cell">
              <button
                className="day-card-cell-button day-card-period-button"
                onClick={toggle}
                aria-label={`Vis detaljer for ${LABELS_NO[key]}`}
                aria-expanded={open}
                aria-controls={panelId}
                type="button"
              >
                {renderIcon(key)}
              </button>
            </td>
          ))
        )}

        {/* EGEN KOLONNE: Chevron */}
        <td className="day-card-cell-surface day-card-toggle-col">
          <button
            className="day-card-disclosure"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Skjul detaljer" : "Vis detaljer"}
            type="button"
          >
            <ChevronIcon />
          </button>
        </td>
      </tr>

      {/* MIDT: Expanded content */}
      <tr className="day-card-body-row" hidden={!open}>
        <td className="day-card-body-cell" colSpan={6} id={panelId}>
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
              className="day-card-toggle"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label="Skjul detaljer"
              type="button"
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
