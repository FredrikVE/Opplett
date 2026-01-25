//src/ui/view/components/AlertItem.jsx
import { getAlertIconFileName } from "../../utils/getAlertIconFileName.js";

export default function AlertItem({ alert }) {
    const iconFileName = getAlertIconFileName(alert);

    const getRiskLevelText = (riskMatrixColor) => {
        switch (riskMatrixColor) {
            case "Yellow":
                return "Gult nivå";
            case "Orange":
                return "Oransje nivå";
            case "Red":
                return "Rødt nivå";
            default:
                return "";
        }
    };

    const levelText = getRiskLevelText(alert.riskMatrixColor);
    
    return (
        <div className={`alert-card alert-${alert.riskMatrixColor?.toLowerCase() ?? "yellow"}`}>

            <div className="alert-header">
                <img
                    src={`/alert_symbols/128/${iconFileName}`}
                    alt=""
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
