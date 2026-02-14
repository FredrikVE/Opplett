//src/ui/view/components/HomePage/Graph/graphConfig/wind/windSeries.js
import { COLORS } from "../constants";

export function buildWindSeries(data) {
    return [
        {
            name: "Vind",
            type: "areaspline",
            data: data.wind,
            color: COLORS.wind,
            zIndex: 2
        },
        {
            name: "Vindkast",
            type: "spline",
            data: data.gust,
            color: COLORS.windGust,
            dashStyle: "ShortDot",
            zIndex: 3,
            opacity: 0.8
        }
    ];
}