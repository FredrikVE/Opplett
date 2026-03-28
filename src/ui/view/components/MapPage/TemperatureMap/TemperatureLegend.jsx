//src/ui/view/components/MapPage/TemperatureMap/TemperatureLegend.jsx
import { buildTemperatureLegendSteps } from "./TemperatureScale";

export default function TemperatureLegend({ isVisible }) {

	if (!isVisible) {
		return null;
	}

	const steps = buildTemperatureLegendSteps();

	return (
		<div className="temperature-legend">
			<div className="temperature-legend-header">
				<span className="temperature-legend-unit">°C</span>
			</div>

			<div className="temperature-legend-scale">
				{steps.map((step) => (
					<div key={step.label} className="temperature-legend-step">
						<div
							className="temperature-legend-color"
							style={{ backgroundColor: step.color }}
						/>
						<span className="temperature-legend-label">
							{step.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}