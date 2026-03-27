/**
 * Kompakt nedbørslegende à la yr.no.
 * Kun 3 trinn: >15, 5, <0.2 mm/t
 * Gradient-bar i stedet for mange små blokker.
 */

const PRECIP_GRADIENT_STOPS = [
	{ percent: 0,   color: "rgba(190, 215, 240, 0.5)" },
	{ percent: 20,  color: "rgba(130, 195, 245, 0.7)" },
	{ percent: 40,  color: "rgba(55, 150, 235, 0.85)" },
	{ percent: 60,  color: "rgba(30, 115, 225, 0.9)" },
	{ percent: 80,  color: "rgba(80, 40, 180, 0.95)" },
	{ percent: 100, color: "rgba(190, 20, 120, 1)" },
];

const gradientString = PRECIP_GRADIENT_STOPS
	.map(s => `${s.color} ${s.percent}%`)
	.join(", ");

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

			<div className="precip-legend-bar-wrap">
				<span className="precip-legend-tick">{">15"}</span>
				<div
					className="precip-legend-bar"
					style={{
						background: `linear-gradient(to bottom, ${gradientString})`,
					}}
				/>
				<span className="precip-legend-tick precip-legend-tick-mid">5</span>
				<div className="precip-legend-bar-spacer" />
				<span className="precip-legend-tick">{"<0.2"}</span>
			</div>
		</div>
	);
}