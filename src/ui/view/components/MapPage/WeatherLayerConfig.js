//src/ui/view/components/MapPage/WeatherLayerConfig.js
import { WindLayer, PrecipitationLayer, PressureLayer, TemperatureLayer, ColorRamp } from "@maptiler/weather";
import { buildWindColorStops } from "./Windmap/WindScale.js";
import { WIND_LAYER_OPTIONS } from "./Windmap/WindLayerOptions.js";
import { buildPrecipColorStops } from "./PrecipitationMap/PrecipitationScale.js";
import { PRESSURE_LAYER_OPTIONS } from "./PressureMap/PressureLayerOptions.js";
import { TEMPERATURE_LAYER_OPTIONS } from "./TemperatureMap/TemperaturLayerOptions.js";
import { LAYER_KEYS } from "./MapLayerToggle/MapToggleConfig.js";

function createWindLayer() {
	return new WindLayer({
		...WIND_LAYER_OPTIONS,
		colorramp: new ColorRamp({ stops: buildWindColorStops() }),
	});
}

function createPrecipitationLayer() {
	return new PrecipitationLayer({
		id: "maptiler-precipitation-layer",
		opacity: 1,
		smooth: false,
		colorramp: new ColorRamp({ stops: buildPrecipColorStops() }),
	});
}

function createPressureLayer() {
	return new PressureLayer(PRESSURE_LAYER_OPTIONS);
}

function createTemperatureLayer() {
	return new TemperatureLayer(TEMPERATURE_LAYER_OPTIONS);
}

export const WEATHER_LAYER_DEFS = [
	{
		key: LAYER_KEYS.WIND,
		id: WIND_LAYER_OPTIONS.id,
		create: createWindLayer,
	},
	{
		key: LAYER_KEYS.PRECIPITATION,
		id: "maptiler-precipitation-layer",
		create: createPrecipitationLayer,
	},
	{
		key: LAYER_KEYS.PRESSURE,
		id: PRESSURE_LAYER_OPTIONS.id,
		create: createPressureLayer,
	},
	{
		key: LAYER_KEYS.TEMPERATURE,
		id: TEMPERATURE_LAYER_OPTIONS.id,
		create: createTemperatureLayer,
	},
];