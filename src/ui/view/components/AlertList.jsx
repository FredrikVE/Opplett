// src/ui/view/components/AlertList.jsx
import AlertItem from "./AlertItem.jsx";

export default function AlertList({ alerts }) {

    // Returnerer null hvis det ikke er noen alerts
    if (!alerts || alerts.length === 0) {
        return null;
    }

    return (
        <section className="alerts-section">
            <h2>Farevarsler</h2>

            {alerts.map(alert => (
                <AlertItem
                    key={alert.interval[0]}
                    alert={alert}
                />
            ))}
        </section>
    );
}
