//src/ui/view/components/MapPage/PressureMap/PressureLegend.jsx
import { buildPressureLegendSteps } from "./PressureScale";

export default function PressureLegend({ isVisible }) {

	if (!isVisible) {
        return null;
    }

	const steps = buildPressureLegendSteps();

	return (
		<div className="map-legend">
			<div className="map-legend-header">
				<span className="map-legend-unit">hPa</span>
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