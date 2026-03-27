//src/ui/view/components/MapPage/PrecipitationMap/Precipitationlegend.jsx
import { getPrecipLegendSteps } from "./PrecipitationScale.js";

export default function PrecipitationLegend({ isVisible }) {
	const LEGEND_STEPS = getPrecipLegendSteps();
	
	if (!isVisible) {
		return null;
	}

	return (
		<div className="precip-legend">
			<div className="precip-legend-header">
				<span className="precip-legend-icon">🌧️</span>
				<span className="precip-legend-unit">mm/t</span>
			</div>

			<div className="precip-legend-scale">
				{LEGEND_STEPS.map((step) => (
					<div key={step.label} className="precip-legend-step">
						<div
							className="precip-legend-color"
							style={{ backgroundColor: step.cssColor }}
						/>
						<span className="precip-legend-label">{step.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}