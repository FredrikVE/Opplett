//src/ui/view/components/MapPage/Windmap/WindScale.js
export const WIND_SCALE = [
	{ value: 0,  color: "#b0d890" },
	{ value: 4,  color: "#88d080" },
	{ value: 7,  color: "#58c898" },
	{ value: 10, color: "#38c0c0" },
	{ value: 13, color: "#30a8d8" },
	{ value: 16, color: "#3888e0" },
	{ value: 20, color: "#5068d8" },
	{ value: 24, color: "#7858d0" },
	{ value: 28, color: "#a050c8" },
	{ value: 32, color: "#c038b8" },
	{ value: 36, color: "#d648a8" },
];


//HEX -> RGBA (uten bitwise “code smell”)
export function hexToRgba(hex) {
	const cleanHex = hex.replace("#", "");

	const r = parseInt(cleanHex.substring(0, 2), 16);
	const g = parseInt(cleanHex.substring(2, 4), 16);
	const b = parseInt(cleanHex.substring(4, 6), 16);

	return [r, g, b, 255];
}

//Stops til ColorRamp
export function buildWindColorStops() {
	return WIND_SCALE.map((s) => ({
		value: s.value,
		color: hexToRgba(s.color),
	}));
}