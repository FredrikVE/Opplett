//src/ui/view/components/HomePage/AlertCard/AlertCard.jsx
import { getAlertIconFileName } from "../../../../utils/getAlertIconFileName.js";
import { getRiskLevelText } from "../../../../utils/getRiskLevelText.js";

const ChevronIcon = ({ isOpen }) => (
    <svg
        className={`chevron ${isOpen ? "open" : ""}`}
        width="20"
        height="20"
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

export default function AlertCard({ alert, isOpen, onToggle }) {

    const iconFileName = getAlertIconFileName(alert);
    const levelText = getRiskLevelText(alert.riskMatrixColor);
    const iconPath = `/alert_symbols/128/${iconFileName}`;

    const mapImage = alert.resources?.find(r => r.mimeType === "image/png");

    const formatDateTime = (iso) =>
        new Date(iso).toLocaleString("no-NO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit"
        });

    return (
        <div
            className={`alert-card alert-${alert.riskMatrixColor?.toLowerCase()}`}
        >
            {/* HEADER */}
            <div className="alert-header" onClick={onToggle}>
                <img src={iconPath} alt="" className="alert-icon" />

                <div className="alert-header-text">
                    <strong>Pågår: {alert.eventAwarenessName}</strong>
                    <div className="alert-level">{levelText}</div>
                </div>

                <ChevronIcon isOpen={isOpen} />
            </div>

            {/* CONTENT */}
            {isOpen && (
                <div className="alert-body">

                    <h3>{alert.eventAwarenessName}</h3>
                    <p>{alert.description}</p>

                    {alert.consequences && (
                        <>
                            <h4>Lokalt vanskelige kjøreforhold</h4>
                            <p>{alert.consequences}</p>
                        </>
                    )}

                    {alert.instruction && (
                        <>
                            <h4>Råd</h4>
                            <p>{alert.instruction}</p>
                        </>
                    )}

                    <h4>Område</h4>
                    <p>{alert.area}</p>

                    {mapImage && (
                        <img
                            src={mapImage.uri}
                            alt="Kart over varsel"
                            className="alert-map"
                        />
                    )}

                    <h4>Tidsperiode</h4>
                    <ul className="alert-time">
                        <li>
                            {formatDateTime(alert.interval[0])} – faren pågår
                        </li>
                        <li>
                            {formatDateTime(alert.interval[1])} – faren minker
                        </li>
                    </ul>

                    <div className="alert-legend">
                        <div><span className="legend yellow" /> Gult - snø</div>
                        <div><span className="legend orange" /> Oransje - svært mye snø</div>
                        <div><span className="legend red" /> Rødt - ekstremt mye snø</div>
                    </div>

                     {/* Bottom toggle */}
                    <div
                        className="alert-bottom-toggle"
                        onClick={onToggle}
                        role="button"
                        aria-label="Lukk varsel"
                    >
                        <ChevronIcon isOpen />
                    </div>

                </div>
            )}
        </div>
    );
}
