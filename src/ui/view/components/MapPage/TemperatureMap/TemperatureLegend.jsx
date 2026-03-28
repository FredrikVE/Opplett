//src/ui/view/components/MapPage/TemperatureMap/TemperatureLegend.jsx
import { buildTemperatureLegendSteps } from "./TemperatureScale";

export default function TemperatureLegend({ isVisible }) {

	if (!isVisible) {
		return null;
	}

	const steps = buildTemperatureLegendSteps();

	return (
		<div className="map-legend">
			<div className="map-legend-header">
				<span className="map-legend-unit">°C</span>
			</div>

			<div className="map-legend-scale">
				{steps.map((step) => (
					<div key={step.label} className="map-legend-step">
						<div
							className="map-legend-color"
							style={{ backgroundColor: step.color }}
						/>
						<span className="map-legend-label">
							{step.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}