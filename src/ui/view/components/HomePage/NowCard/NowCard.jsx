//src/ui/view/components/HomePage/ForecastTable/NowCard.jsx
import { getWeatherIconFileName } from "../../../../utils/weatherIcons.js";
import UVNowBar from "./UVNowBar.jsx";

export default function NowCard({ current }) {

    if (!current) {
        return null;
    }

    const iconFile = getWeatherIconFileName(current.weatherSymbol);

    return (
        <div className="now-card">
            <div className="now-card-header">
                <span className="now-text">Været nå</span>
            </div>

            {/* Hovedinnhold i en flex-rad */}
            <div className="now-card-content">
                <div className="now-main-icon">
                    <img src={`/weather_icons/200/${iconFile}`} alt="Værsymbol" />
                </div>

                <div className="now-temp-section">
                    <div className="temp-main">
                        <span className={`temp-value ${current.temp < 0 ? 'is-cold' : 'is-warm'}`}>
                            {Math.round(current.temp)}°
                        </span>
                    </div>
                    <div className="feels-like">
                        Føles som <span className="feels-value">{Math.round(current.feelsLike)}°</span>
                    </div>
                </div>

                {/* Nedbør */}
                <div className="now-info-item">
                    <span className="info-value">{current.precip}</span>
                    <span className="info-unit">mm</span>
                </div>

                {/* Vind */}
                <div className="now-info-item wind-section">
                    <span className="info-value">{Math.round(current.wind)}</span>
                    <span className="info-sub">({Math.round(current.gust)})</span>
                    <span className="info-unit">m/s</span>

                    {/*Vindpil */}
                    <span className="wind-arrow" style={{ transform: `rotate(${current.windDir}deg)` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 19V5M12 5L5 12M12 5L19 12" />
                        </svg>
                    </span>
                </div>
            </div>
            
            {/* UV-now-bar */}
            <div>
                <UVNowBar uvValue={current.uv} />
            </div>
            
        </div>
    );
}