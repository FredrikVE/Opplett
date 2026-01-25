// src/ui/view/components/SolarInformation.jsx
export default function SolarInformation({ sunTimes }) {
    if (!sunTimes) return null;

    return (
        <div className="solar-info">
            <div className="solar-item">
                <img
                    src="/sun_rise/soloppgang.png"
                    alt="Soloppgang"
                    className="solar-icon"
                />
                <span className="solar-label">Sol opp</span>
                <span className="solar-time">{sunTimes.sunrise}</span>
            </div>

            <div className="solar-item">
                <img
                    src="/sun_rise/solnedgang.png"
                    alt="Solnedgang"
                    className="solar-icon"
                />
                <span className="solar-label">Sol ned</span>
                <span className="solar-time">{sunTimes.sunset}</span>
            </div>
        </div>
    );
}
