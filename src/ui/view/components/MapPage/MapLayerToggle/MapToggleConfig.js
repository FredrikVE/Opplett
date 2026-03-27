//src/ui/view/components/MapPage/MapLayerToggle/MapToggleConfig.js
export const LAYER_KEYS = {
    NONE: "none",
    WIND: "wind",
    // Fremtidige lag:
    PRECIPITATION: "precipitation",
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
    {
     	key: LAYER_KEYS.PRECIPITATION,
     	label: "Nedbør",
     	icon: "🌧️",
    },
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
