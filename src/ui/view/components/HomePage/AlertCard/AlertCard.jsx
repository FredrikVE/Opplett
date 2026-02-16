//src/ui/view/components/HomePage/AlertCard/AlertCard.jsx
import { getAlertIconFileName } from "../../../../utils/getAlertIconFileName.js";
import { getRiskLevelText } from "../../../../utils/getRiskLevelText.js";
import ChevronIcon from "../../Common/Buttons/ChevronIcon.jsx";

export default function AlertCard({ alert, isOpen, onToggle, formatLocalDateTime }) {

    const iconFileName = getAlertIconFileName(alert);
    const levelText = getRiskLevelText(alert.riskMatrixColor);
    const iconPath = `/alert_symbols/128/${iconFileName}`;

    const mapImage = alert.resources?.find(r => r.mimeType === "image/png");

   
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

                <ChevronIcon 
                    isOpen={isOpen} 
                    className=""
                    size={20}
                />
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
                            {alert.interval?.[0] && formatLocalDateTime(alert.interval[0])} – faren pågår
                        </li>
                        <li>
                            {alert.interval?.[1] && formatLocalDateTime(alert.interval[1])} – faren minker
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
                        <ChevronIcon
                            isOpen={true} 
                            className=""
                            size={20}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}
