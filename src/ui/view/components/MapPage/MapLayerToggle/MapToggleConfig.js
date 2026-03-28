// src/ui/view/components/MapPage/MapLayerToggle/MapToggleConfig.js
import MapStandardIcon from "../../Common/Icons/MapStandardIcon.jsx";
import WindIcon from "../../Common/Icons/WindIcon.jsx";
import PrecipitationIcon from "../../Common/Icons/PrecipitationIcon.jsx";
import PressureIcon from "../../Common/Icons/PressureIcon.jsx";
import TemperatureIcon from "../../Common/Icons/TemperatureIcon.jsx";

export const LAYER_KEYS = {
	NONE: "none",
	WIND: "wind",
	PRECIPITATION: "precipitation",
	PRESSURE: "pressure",
	TEMPERATURE: "temperature",
};

const ICON_SIZE = 18;

export const WEATHER_LAYERS = [
	{
		key: LAYER_KEYS.NONE,
		label: "Standard",
		icon: MapStandardIcon,
		iconSize: ICON_SIZE,
	},
	{
		key: LAYER_KEYS.WIND,
		label: "Vind",
		icon: WindIcon,
		iconSize: ICON_SIZE,
	},
	{
		key: LAYER_KEYS.PRECIPITATION,
		label: "Nedbør",
		icon: PrecipitationIcon,
		iconSize: ICON_SIZE,
	},
	{
		key: LAYER_KEYS.PRESSURE,
		label: "Lufttrykk",
		icon: PressureIcon,
		iconSize: ICON_SIZE,
	},
	{
		key: LAYER_KEYS.TEMPERATURE,
		label: "Temperatur",
		icon: TemperatureIcon,
		iconSize: ICON_SIZE,
	},
];