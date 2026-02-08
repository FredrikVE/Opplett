//src/ui/view/components/HomePage/Graph/graphConfig/windXAxis.js
import { buildXAxis } from './xAxis';

export function buildWindXAxis({data, dayBands, getLocalHour, formatLocalDate}) {

    //Gjenbruker samme layout-kontrakt som meteogramet for Temperatur og nedbør
    return buildXAxis(data, dayBands, getLocalHour, formatLocalDate);
}
