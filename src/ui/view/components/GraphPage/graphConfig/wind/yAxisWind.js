// src/ui/view/components/GraphPage/graphConfig/wind/yAxisWind.js
import { COLORS } from "../constants";

export function buildWindYAxis(maxGust) {
    return [
        {
            //Vindstyrke (nederst)
            title: { text: null },
            min: 0,
            softMax: maxGust + 1,
            tickAmount: 5,
            top: "20%",      // Starter 20% ned fra toppen
            height: "80%",   // Bruker resten av plassen
            lineColor: COLORS.text,
            lineWidth: 1.5,
            gridLineWidth: 0,
            labels: {
                format: "{value} m/s",
                style: { color: COLORS.textMuted, fontWeight: "bold" }
            }
        },
        {
            //Vindpiler (øverst)
            title: { text: null },
            labels: { enabled: false },
            gridLineWidth: 0,
            lineWidth: 0,
            min: 0,
            max: 1,
            top: "0%",       // Øverst i grafen
            height: "20%",   // Tar de øverste 20%
            offset: 0
        }
    ];
}