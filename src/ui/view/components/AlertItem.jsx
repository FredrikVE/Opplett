// src/ui/view/components/AlertItem.jsx
export default function AlertItem({ alert }) {
    return (
        <div className={`alert alert-${alert.riskColor.toLowerCase()}`}>
            <h3>{alert.eventAwarenessName}</h3>

            <p>{alert.description}</p>

            {alert.consequences && (
                <p><strong>Konsekvenser:</strong> {alert.consequences}</p>
            )}

            {alert.instruction && (
                <p><strong>Råd:</strong> {alert.instruction}</p>
            )}

            <p>
                <em>{alert.area}</em>
            </p>
        </div>
    );
}
