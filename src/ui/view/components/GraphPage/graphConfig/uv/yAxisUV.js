//src/ui/view/components/GraphPage/graphConfig/uv/xAxisUV.js
import { COLORS } from "../constants";

export function buildUVYAxis() {
    return {
        title: { text: null },
        min: 0,
        softMax: 8, 
        tickInterval: 1,
        gridLineDashStyle: 'Dash',
        lineColor: COLORS.text,
        lineWidth: 1.5,
        labels: {
            style: {
                color: COLORS.textMuted,
                fontWeight: "bold",
                fontSize: "11px"
            },
            formatter: function() {
                return this.value;
            }
        }
    };
}