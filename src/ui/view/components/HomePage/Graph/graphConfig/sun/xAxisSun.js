//src/ui/view/components/HomePage/Graph/graphConfig/sun/xAxisSun.js
import { COLORS } from "../constants";

export function buildSunXAxis(formatLocalDate) {
    return {
        type: "datetime",
        tickInterval: 24 * 3600 * 1000,
        labels: {
            formatter() { 
                return formatLocalDate ? formatLocalDate(this.value).split(" ")[0] : ""; 
            },
            style: { fontWeight: "bold", color: COLORS.textMuted }
        }
    };
}