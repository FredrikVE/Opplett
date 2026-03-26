//src/ui/view/components/MapPage/WindLegend.jsx
import { WIND_LEGEND_STEPS } from "../../../utils/MapUtils/MapModeLayers/Weatherlayerconfig.js";
import "../../../style/WindLegend.css";

export default function WindLegend({ isVisible }) {
	if (!isVisible) return null;

	return (
		<div className="wind-legend">
			<div className="wind-legend-header">
				<span className="wind-legend-icon">💨</span>
				<span className="wind-legend-unit">m/s</span>
			</div>

			<div className="wind-legend-scale">
				{WIND_LEGEND_STEPS.map((step) => (
					<div key={step.label} className="wind-legend-step">
						<div
							className="wind-legend-color"
							style={{ backgroundColor: step.color }}
						/>
						<span className="wind-legend-label">{step.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}