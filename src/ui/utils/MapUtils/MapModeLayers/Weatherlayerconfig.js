//src/ui/utils/MapUtils/MapModeLayers/Weatherlayerconfig.js
/**
 * Konfigurasjon for vær-overlay-lag på kartet.
 * 
 * Hvert lag har en unik nøkkel, visningsnavn, og en factory-funksjon
 * som oppretter selve MapTiler Weather-laget.
 * 
 * For å legge til nye lag (f.eks. nedbør, radar, temperatur):
 *   1. Legg til en ny entry i WEATHER_LAYERS
 *   2. Opprett en tilhørende hook (useXxxLayer.js)
 * 
 * @module WeatherLayerConfig
 */

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
	opacity: 0.8,
	speed: 0.001,
	fadeFactor: 0.03,
	density: 4,
	color: [255, 255, 255, 50],
	fastColor: [255, 255, 255, 220],
	size: 1.8,
	fastIsLarger: true,
};

/**
 * Legenden for vindstyrke i m/s.
 * Farger tilpasset yr.no sin skala:
 *   svak vind = lys grønn, sterk vind = mørk lilla/rosa
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