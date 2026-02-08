//src/ui/view/components/HomePage/AlertCard/AlertItem.jsx
import { getAlertIconFileName } from "../../../../utils/getAlertIconFileName.js";
import { getRiskLevelText } from "../../../../utils/getRiskLevelText.js";

export default function AlertItem({ alert }) {

    // variabler for å holde på informasjon om fareikoner
    const iconFileName = getAlertIconFileName(alert);
    const levelText = getRiskLevelText(alert.riskMatrixColor);
    const iconPath = `/alert_symbols/128/${iconFileName}`;

    return (
        <div className={`alert-card alert-${alert.riskMatrixColor?.toLowerCase() ?? "lightslategray"}`}>

            <div className="alert-header">
                <img
                    src={iconPath}
                    alt=""                        // tom alt tag for å ikke overvelde skjermlesere jf WCAG.
                    className="alert-icon"
                />
                <div>
                    <strong>{alert.eventAwarenessName}</strong>
                    <div className="alert-level">{levelText}</div>
                </div>
            </div>

            <p className="alert-description">{alert.description}</p>

            {alert.consequences && (
                <p>
                    <strong>Konsekvenser:</strong> {alert.consequences}
                </p>
            )}

            {alert.instruction && (
                <p>
                    <strong>Råd:</strong> {alert.instruction}
                </p>
            )}

            <p className="alert-area">{alert.area}</p>
        </div>
    );
}
