//src/ui/view/components/GraphPage/graphConfig/uv/xAxisUV.js
import { buildWeatherXAxis } from "../weather/xAxisWeather";

export function buildUVXAxis({ data, dayBands, getLocalHour, formatLocalDate }) {
    // Gjenbruker samme layout som vær/vind meteogrammet for gjenburk og konsistent design
    return buildWeatherXAxis(data, dayBands, getLocalHour, formatLocalDate);
}