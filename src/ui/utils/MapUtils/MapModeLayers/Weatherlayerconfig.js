//src/ui/utils/MapUtils/MapModeLayers/Weatherlayerconfig.js
export const LAYER_KEYS = {
	NONE: "none",
	WIND: "wind",
	// Fremtidige lag:
	// PRECIPITATION: "precipitation",
	// RADAR: "radar",
	// TEMPERATURE: "temperature",
};

export const WEATHER_LAYERS = [
	{
		key: LAYER_KEYS.NONE,
		label: "Standard",
		icon: "🗺️",
	},
	{
		key: LAYER_KEYS.WIND,
		label: "Vind",
		icon: "💨",
	},
	// {
	// 	key: LAYER_KEYS.PRECIPITATION,
	// 	label: "Nedbør",
	// 	icon: "🌧️",
	// },
	// {
	// 	key: LAYER_KEYS.RADAR,
	// 	label: "Radar",
	// 	icon: "📡",
	// },
	// {
	// 	key: LAYER_KEYS.TEMPERATURE,
	// 	label: "Temperatur",
	// 	icon: "🌡️",
	// },
];

/**
 * Standard innstillinger for WindLayer.
 * Justert for yr.no-stil:
 *   - Sterkere partikler (høy density, tydelig fastColor)
 *   - Lav fadeFactor for lengre partikkelstrømmer
 *   - fastIsLarger for visuell hastighetsforskjell
 */
export const WIND_LAYER_OPTIONS = {
	id: "maptiler-wind-layer",

	opacity: 0.6,

	//MOTION (VIKTIG)
	speed: 0.0015,
	fadeFactor: 0.035,

	//VISUAL
	density: 3,
	size: 1,

	color: [255, 255, 255, 40],
	fastColor: [255, 255, 255, 160],
	fastIsLarger: true,
};

/**
 * yr.no-inspirert fargeskala for vind (m/s).
 * Grønn (svak) → cyan → blå → lilla → rosa (sterk).
 * Brukes med ColorRamp({ stops: [...] }) i useWindLayer.
 * Verdiene er i m/s, fargene i [R, G, B, A].
 */
export const WIND_COLOR_STOPS = [
	{ value: 0,  color: [176, 216, 144, 255] }, // grønn
	{ value: 4,  color: [136, 208, 128, 255] },
	{ value: 7,  color: [88, 200, 152, 255] },
	{ value: 10, color: [56, 192, 192, 255] }, // cyan
	{ value: 13, color: [48, 168, 216, 255] },
	{ value: 16, color: [56, 136, 224, 255] }, // blå
	{ value: 20, color: [80, 104, 216, 255] },
	{ value: 24, color: [120, 88, 208, 255] },
	{ value: 28, color: [160, 80, 200, 255] },
	{ value: 32, color: [192, 56, 184, 255] }, // lilla
	{ value: 36, color: [214, 72, 168, 255] }, // rosa
];

/**
 * Legenden for vindstyrke i m/s.
 * Farger tilpasset yr.no sin skala.
 */
export const WIND_LEGEND_STEPS = [
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