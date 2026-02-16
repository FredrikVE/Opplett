//src/ui/view/components/AlertPage/AlertSection.jsx
import { useState } from "react";
import AlertList from "../HomePage/AlertCard/AlertList.jsx";
import ChevronIcon from "../Common/Buttons/ChevronIcon.jsx";

export default function AlertSection({ title, alerts, formatLocalDateTime, limit = 4 }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (alerts.length === 0) return null;

    const alertsToShow = isExpanded ? alerts : alerts.slice(0, limit);
    const hasMore = alerts.length > limit;

    return (
        <section className="alerts-section">
            <h2>{title}</h2>
            <AlertList alerts={alertsToShow} formatLocalDateTime={formatLocalDateTime} />
            
            {hasMore && (
                <button className="expand-alerts-btn" onClick={() => setIsExpanded(!isExpanded)}>
                    <span>{isExpanded ? "Vis færre" : `Vis alle (${alerts.length})`}</span>
                    <ChevronIcon isOpen={isExpanded} size={16} />
                </button>
            )}
        </section>
    );
}