//src/ui/view/components/MapPage/MapHooks/WeatherLayerConfig.js
import { WindLayer, PrecipitationLayer, PressureLayer, TemperatureLayer, ColorRamp } from "@maptiler/weather";
import { buildWindColorStops } from "../Windmap/WindScale";
import { WIND_LAYER_OPTIONS } from "../Windmap/WindLayerOptions";
import { buildPrecipColorStops } from "../PrecipitationMap/PrecipitationScale.js";
import { PRESSURE_LAYER_OPTIONS } from "../PressureMap/PressureLayerOptions";
import { TEMPERATURE_LAYER_OPTIONS } from "../TemperatureMap/TemperaturLayerOptions";
import { LAYER_KEYS } from "../MapLayerToggle/MapToggleConfig.js";

export const WEATHER_LAYER_DEFS = [
	{
		key: LAYER_KEYS.WIND,
		create: () => new WindLayer({
			...WIND_LAYER_OPTIONS,
			colorramp: new ColorRamp({ stops: buildWindColorStops() }),
		}),
		id: WIND_LAYER_OPTIONS.id,
	},
	{
		key: LAYER_KEYS.PRECIPITATION,
		create: () => new PrecipitationLayer({
			id: "maptiler-precipitation-layer",
			opacity: 1,
			smooth: false,
			colorramp: new ColorRamp({ stops: buildPrecipColorStops() }),
		}),
		id: "maptiler-precipitation-layer",
	},
	{
		key: LAYER_KEYS.PRESSURE,
		create: () => new PressureLayer(PRESSURE_LAYER_OPTIONS),
		id: PRESSURE_LAYER_OPTIONS.id,
	},
	{
		key: LAYER_KEYS.TEMPERATURE,
		create: () => new TemperatureLayer(TEMPERATURE_LAYER_OPTIONS),
		id: TEMPERATURE_LAYER_OPTIONS.id,
	},
];