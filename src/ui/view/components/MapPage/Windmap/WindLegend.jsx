//src/ui/view/components/MapPage/WindLegend.jsx
import { buildWindLegendSteps } from "./WindScale";

export default function WindLegend({ isVisible }) {
	if (!isVisible) {
		return null;
	}

	const steps = buildWindLegendSteps();

	return (
		<div className="wind-legend">
			<div className="wind-legend-header">
				<span className="wind-legend-unit">m/s</span>
			</div>

			<div className="wind-legend-scale">
				{steps.map((step) => (
					<div key={step.label} className="wind-legend-step">
						<div
							className="wind-legend-color"
							style={{ backgroundColor: step.color }}
						/>
						<span className="wind-legend-label">
							{step.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}