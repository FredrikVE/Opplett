//src/ui/view/components/HomePage/ForecastTable/SolarInformation.jsx

export default function SolarInformation({ sunTimes }) {
    // Sjekker om vi har nødvendig data før vi tegner
    if (!sunTimes || !sunTimes.dayLengthDiffText) {
        return null;
    }

    return (
        <div className="solar-info">
            {/* Sol opp */}
            <div className="solar-item">
                <img src="/sun_rise/soloppgang.png" alt="Sol opp" className="solar-icon" />
                <span className="solar-label">Sol opp</span>
                <span className="solar-time">{sunTimes.sunrise}</span>
            </div>

            {/* Endring i dagslengde - Midten */}
            <div className="solar-item solar-diff-item">
                <span className="solar-label">Dagslengde</span>
                <span className={`solar-time diff-value ${sunTimes.isGettingLonger ? 'is-longer' : ''}`}>
                    {sunTimes.dayLengthDiffText}
                </span>
                <span className="solar-sublabel">siden i går</span>
            </div>

            {/* Sol ned */}
            <div className="solar-item">
                <img src="/sun_rise/solnedgang.png" alt="Sol ned" className="solar-icon" />
                <span className="solar-label">Sol ned</span>
                <span className="solar-time">{sunTimes.sunset}</span>
            </div>
        </div>
    );
}