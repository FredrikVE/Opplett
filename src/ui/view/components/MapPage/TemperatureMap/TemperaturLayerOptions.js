//src/ui/view/components/MapPage/TemperatureMap/TemperaturLayerOptions.js
import { ColorRamp } from "@maptiler/weather";

export const TEMPERATURE_LAYER_OPTIONS = {
    id: "maptiler-temperature-layer",
    colorramp: ColorRamp.builtin.TEMPERATURE_3,
    opacity: 0.8,
};