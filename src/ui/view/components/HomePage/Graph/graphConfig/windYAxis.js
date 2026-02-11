//src/ui/view/components/HomePage/Graph/graphConfig/windYAxis.js
import { COLORS } from './constants';

export function buildWindYAxis(maxGust) {
    return [
        {
            // INDEX 0: Venstre akse (Vindstyrke)
            min: 0,
            softMax: maxGust + 1,
            tickAmount: 5,
            lineColor: COLORS.text,
            lineWidth: 1.5,
            gridLineWidth: 0,
            title: { text: null },
            labels: {
                format: '{value} m/s',
                style: {
                    color: COLORS.textMuted,
                    fontWeight: 'bold',
                    fontSize: '11px'
                }
            }
        },
        {
            // INDEX 1: Høyre akse (Usynlig skygge-akse for layout)
            opposite: true,
            linkedTo: 0,
            gridLineWidth: 0,
            lineWidth: 0,
            tickWidth: 0,

            title: { 
                text: null 
            },
            labels: { 
                enabled: false 
            }
        }
    ];
}