//src/ui/view/components/GraphPage/graphConfig/sun/yAxisSun.js
import { COLORS } from "../constants.js";

export function buildSunYAxis(axisMin) {
    return {
        visible: true,
        title: { text: null },
        min: axisMin,
        tickInterval: 1,
        gridLineDashStyle: 'Dash',
        labels: {
            format: "{value} t",
            style: { color: COLORS.textMuted, fontWeight: "bold" }
        },
        lineWidth: 1.5,
        lineColor: '#ccd6eb'
    };
}