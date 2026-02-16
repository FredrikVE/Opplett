//src/ui/view/components/HomePage/Graph/graphConfig/wind/plotOptionsWind.js
import Highcharts from "highcharts";
import { COLORS } from "../constants";

export function buildWindPlotOptions() {
    return {
        areaspline: {
            fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, Highcharts.color(COLORS.wind).setOpacity(0.3).get('rgba')],
                    [1, Highcharts.color(COLORS.wind).setOpacity(0).get('rgba')]
                ]
            },
            lineWidth: 2.5,
            marker: { 
                enabled: false,
                states: {
                    hover: { enabled: true, radius: 4 }
                }
            },
            threshold: null
        },
        spline: {
            lineWidth: 2,
            marker: { enabled: false },
            states: {
                hover: { lineWidthPlus: 0 }
            }
        }
    };
}