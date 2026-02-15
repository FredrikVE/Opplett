//src/ui/view/components/HomePage/AlertCard/AlertList.jsx
import { useState } from "react";
import AlertCard from "./AlertCard.jsx";

export default function AlertList({ alerts }) {
    // Viktig: Vi holder styr på ID-en til det varselet som er åpent
    const [openAlertId, setOpenAlertId] = useState(null);

    if (!alerts || alerts.length === 0) {
        return null;
    }

    return (
        <div className="alerts-list-container">
            {alerts.map((alert) => (
                <AlertCard
                    key={alert.id} // Bruk den unike ID-en fra MET
                    alert={alert}
                    isOpen={openAlertId === alert.id}
                    onToggle={() => setOpenAlertId(prev => prev === alert.id ? null : alert.id)}
                />
            ))}
        </div>
    );
}