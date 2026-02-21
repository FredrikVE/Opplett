//src/ui/view/components/GraphPage/graphConfig/weather/yAxisWeather.js
import { COLORS } from "../constants.js";

export function buildWeatherYAxis(midnights) {
    return [
        {
            //Temperatur
            title: { text: null },
            top: "20%",
            height: "80%",
            gridLineWidth: 0,
            lineColor: COLORS.text,
            lineWidth: 1.5,
            labels: {
                format: "{value}°",
                style: {
                    color: COLORS.textMuted,
                    fontWeight: "bold"
                }
            },
            plotLines: [
                {
                    value: 0,
                    color: "#ccc",
                    dashStyle: "Dash",
                    width: 1
                },
                //Vertikale skillelinjer for midnatt
                ...midnights.map(t => ({
                    value: t,
                    color: "#ddd",
                    width: 1,
                    zIndex: 1
                }))
            ]
        },
        {
            //Nedbør
            title: { text: null },
            opposite: true,
            min: 0,
            softMax: 3, // Aksen vil alltid vise minst 0 til 3 mm for å gi inntrykk av om det er mye/lite nedbør
            tickAmount: 5, 
            top: "20%",
            height: "80%",
            gridLineWidth: 0,
            lineColor: COLORS.text,
            lineWidth: 1.5,
            labels: {
                format: "{value} mm",
                style: {
                    color: COLORS.textMuted,
                    fontSize: "10px",
                    fontWeight: "bold"
                }
            }
        },
        {
            //Værsymboler
            title: { text: null },
            labels: { enabled: false },
            gridLineWidth: 0,
            lineWidth: 0,
            min: 0,
            max: 1,
            height: "20%",
            top: "0%",
            offset: 0
        }
    ];
}
