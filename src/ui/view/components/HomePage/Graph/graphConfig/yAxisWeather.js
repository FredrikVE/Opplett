// src/ui/view/components/HomePage/Graph/graphConfig/yAxis.js
import { COLORS } from "./constants.js";

export function buildWeatherYAxis(midnights) {
    return [
        {
            // --- INDEX 0: TEMPERATUR ---
            title: { text: null },
            top: '20%',
            height: '80%',
            gridLineWidth: 0,
            lineColor: COLORS.text,
            lineWidth: 1.5,
            labels: {
                format: '{value}°',
                style: {
                    color: COLORS.textMuted,
                    fontWeight: 'bold'
                }
            },
            plotLines: [
                {
                    value: 0,
                    color: '#ccc',
                    dashStyle: 'Dash',
                    width: 1
                },
                // Vertikale skillelinjer for midnatt
                ...midnights.map(t => ({
                    value: t,
                    color: '#ddd',
                    width: 1,
                    zIndex: 1
                }))
            ]
        },
        {
            // --- INDEX 1: NEDBØR ---
            title: { text: null },
            opposite: true,
            min: 0,
            top: '20%',
            height: '80%',
            gridLineWidth: 0,
            lineColor: COLORS.text,
            lineWidth: 1.5,
            labels: {
                format: '{value} mm',
                style: {
                    color: COLORS.textMuted,
                    fontSize: '10px',
                    fontWeight: 'bold'
                }
            }
        },
        {
            // --- INDEX 2: VÆRSYMBOLER ---
            // Plasserer ikon-raden helt øverst uten tall eller linjer
            title: { text: null },
            labels: { enabled: false },
            gridLineWidth: 0,
            lineWidth: 0,
            min: 0,
            max: 1,
            height: '20%',
            top: '0%',
            offset: 0
        }
    ];
}
