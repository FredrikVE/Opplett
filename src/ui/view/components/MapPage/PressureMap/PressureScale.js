//src/ui/view/components/MapPage/PressureMap/PressureScale.js
export const PRESSURE_SCALE = [
	{ value: 980, color: "#5e4fa2" },
	{ value: 990, color: "#3288bd" },
	{ value: 1000, color: "#66c2a5" },
	{ value: 1010, color: "#abdda4" },
	{ value: 1020, color: "#e6f598" },
	{ value: 1030, color: "#fee08b" },
	{ value: 1040, color: "#fdae61" },
	{ value: 1050, color: "#f46d43" },
];

export function buildPressureLegendSteps() {
	const reversed = [...PRESSURE_SCALE].reverse();

	return reversed.map((s, i) => {
		if (i === 0) {
			return { label: `>${s.value}`, color: s.color };
		}

		if (i === reversed.length - 1) {
			return { label: `<${reversed[i - 1].value}`, color: s.color };
		}

		return { label: `${s.value}`, color: s.color };
	});
}