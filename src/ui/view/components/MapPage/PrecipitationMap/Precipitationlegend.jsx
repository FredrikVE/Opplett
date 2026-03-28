//src/ui/view/components/MapPage/PrecipitationMap/Precipitationlegend.jsx
import { getPrecipLegendSteps } from "./PrecipitationScale.js";

export default function PrecipitationLegend({ isVisible }) {
	const LEGEND_STEPS = getPrecipLegendSteps();
	
	if (!isVisible) {
		return null;
	}

	return (
		<div className="map-legend">
			<div className="map-legend-header">
				<span className="map-legend-unit">mm/t</span>
			</div>

			<div className="map-legend-scale">
				{LEGEND_STEPS.map((step) => (
					<div key={step.label} className="map-legend-step">
						<div
							className="map-legend-color"
							style={{ backgroundColor: step.cssColor }}
						/>
						<span className="map-legend-label">{step.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}