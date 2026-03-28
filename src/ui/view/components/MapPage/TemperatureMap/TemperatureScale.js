//src/ui/view/components/MapPage/TemperatureMap/TemperatureScale.js
export const TEMPERATURE_SCALE = [
	{ value: -30, color: "#2c7bb6", label: "-30" },
	{ value: -20, color: "#00a6ca", label: "-20" },
	{ value: -10, color: "#00ccbc", label: "-10" },
	{ value: 0,   color: "#90eb9d", label: "0" },
	{ value: 10,  color: "#ffff8c", label: "10" },
	{ value: 20,  color: "#f9d057", label: "20" },
	{ value: 30,  color: "#f29e2e", label: "30" },
	{ value: 40,  color: "#e76818", label: "40" },
	{ value: 50,  color: "#d7191c", label: ">40" },
];

export function buildTemperatureLegendSteps() {
	return [...TEMPERATURE_SCALE].reverse().map((s, i, arr) => {

		if (i === 0) {
			return {
				label: `>${arr[i].value}`,
				color: s.color,
			};
		}

		if (i === arr.length - 1) {
			return {
				label: `<${arr[i - 1].value}`,
				color: s.color,
			};
		}

		return {
			label: `${s.value}`,
			color: s.color,
		};
	});
}