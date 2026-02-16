//src/ui/view/components/HomePage/AlertCard/AlertCard.jsx
import { getAlertIconFileName } from "../../../../utils/getAlertIconFileName.js";
import { getRiskLevelText } from "../../../../utils/getRiskLevelText.js";
import ChevronIcon from "../Buttons/ChevronIcon.jsx";

export default function AlertCard({ alert, isOpen, onToggle, formatLocalDateTime }) {

    const iconFileName = getAlertIconFileName(alert);
    const levelText = getRiskLevelText(alert.riskMatrixColor);
    const iconPath = `/alert_symbols/128/${iconFileName}`;

    const mapImage = alert.resources?.find(r => r.mimeType === "image/png");

    // Bestem tekst for domene-taggen
    const domainTagText = alert.geographicDomain === "marine" ? "Hav og kyst" : "Land";
   
    return (
        <div className={`alert-card alert-${alert.riskMatrixColor?.toLowerCase()}`}>
            
            {/* HEADER */}
            <div className="alert-header" onClick={onToggle}>
                <img src={iconPath} alt="" className="alert-icon" />

                <div className="alert-header-text">
                    {/* Stedsnavn/Område øverst som hos Yr */}
                    <span className="alert-area-name">{alert.area}</span>
                    
                    {/* Eventnavn og Domene-tag på samme linje */}
                    <div className="alert-title-row">
                        <strong>{alert.eventAwarenessName}</strong>
                        <span className={`domain-tag tag-${alert.geographicDomain}`}>
                            {domainTagText}
                        </span>
                    </div>

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
                            <h4>Konsekvenser</h4>
                            <p>{alert.consequences}</p>
                        </>
                    )}

                    {alert.instruction && (
                        <>
                            <h4>Råd</h4>
                            <p>{alert.instruction}</p>
                        </>
                    )}

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
                            Fra: {alert.interval?.[0] && formatLocalDateTime(alert.interval[0])}
                        </li>
                        <li>
                            Til: {alert.interval?.[1] && formatLocalDateTime(alert.interval[1])}
                        </li>
                    </ul>

                    {/* Bottom toggle */}
                    <div
                        className="alert-bottom-toggle"
                        onClick={onToggle}
                        role="button"
                    >
                        <span style={{fontSize: '14px', marginRight: '8px'}}>Lukk</span>
                        <ChevronIcon isOpen={true} size={18} />
                    </div>
                </div>
            )}
        </div>
    );
}