//src/ui/view/components/MapPage/PrecipitationMap/Precipitationlegend.jsx
const PRECIP_LEGEND_STEPS = [
	{ label: ">50",  color: "#ff00ff" },
	{ label: "30",   color: "#cc00cc" },
	{ label: "20",   color: "#8800cc" },
	{ label: "10",   color: "#4400ff" },
	{ label: "5",    color: "#0066ff" },
	{ label: "2",    color: "#0099ff" },
	{ label: "1",    color: "#00ccff" },
	{ label: "0.5",  color: "#00eeff" },
	{ label: "0.2",  color: "#aaffee" },
	{ label: "<0.1", color: "#eeffff" },
];

export default function PrecipitationLegend({ isVisible }) {
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
				{PRECIP_LEGEND_STEPS.map((step) => (
					<div key={step.label} className="precip-legend-step">
						<div
							className="precip-legend-color"
							style={{ backgroundColor: step.color }}
						/>
						<span className="precip-legend-label">{step.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}