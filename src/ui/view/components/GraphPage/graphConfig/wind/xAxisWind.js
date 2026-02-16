//src/ui/view/components/GraphPage/graphConfig/wind/xAxisWind.js
import { buildWeatherXAxis } from "../weather/xAxisWeather";

export function buildWindXAxis({data, dayBands, getLocalHour, formatLocalDate}) {

    //Gjenbruker samme layout-kontrakt som meteogramet for Temperatur og nedbør
    return buildWeatherXAxis(data, dayBands, getLocalHour, formatLocalDate);
}
