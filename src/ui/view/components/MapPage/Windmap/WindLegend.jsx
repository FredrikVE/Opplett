//src/ui/view/components/MapPage/WindLegend.jsx

/**
 * Legenden for vindstyrke i m/s.
 * Farger tilpasset yr.no sin skala.
 */

//BURDE ikke disse fargene egentlig brukes i den WIND_COLOR_STEP??
const WIND_LEGEND_STEPS = [
	{ label: ">32.6", color: "#d648a8" },
	{ label: "28.5",  color: "#a050c8" },
	{ label: "24.5",  color: "#7858d0" },
	{ label: "20.8",  color: "#5068d8" },
	{ label: "17.2",  color: "#3888e0" },
	{ label: "13.9",  color: "#30a8d8" },
	{ label: "10.8",  color: "#38c0c0" },
	{ label: "8",     color: "#58c898" },
	{ label: "5.5",   color: "#88d080" },
	{ label: "<5.4",  color: "#b0d890" },
];

export default function WindLegend({ isVisible }) {

	if (!isVisible) {
		return null;
	}

	return (
		<div className="wind-legend">
			<div className="wind-legend-header">
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