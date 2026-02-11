// src/ui/view/components/HomePage/Graph/WindMeteogram.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapHourlyForecastToWind } from "./graphUtils/mapHourlyForecastToWind";
import { buildDayBands } from "./graphUtils/dayBands";
import { buildWindXAxis } from "./graphConfig/xAxisWind";
import { buildWindYAxis } from "./graphConfig/yAxiswind";
import { buildCommonChartConfig } from "./graphConfig/chartConfig";

import { COLORS } from "./graphConfig/constants";

export default function WindMeteogram({ hourlyData, getLocalHour, formatLocalDate }) {
    const options = useMemo(() => {
        const data = mapHourlyForecastToWind(hourlyData, getLocalHour);
        
        if (!data) {
            return null;
        }

        const noWind = data.wind.every(([, v]) => v === 0) && data.gust.every(([, v]) => v === 0);
        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        const chart = buildCommonChartConfig();

        // --- Visning ved vindstille ---
        if (noWind) {
            return {
                chart,
                title: { text: "Vind (m/s)" },
                subtitle: {
                    text: "Ingen målbar vind i perioden 🌬️",
                    style: { color: COLORS.textMuted }
                },
                credits: { enabled: false }
            };
        }

        const maxGust = Math.max(...data.gust.map(([, v]) => v));

        return {
            chart,
            
            title: {
                text: "Vind (m/s)",
                style: { 
                    fontWeight: "bold", 
                    fontSize: "20px" 
                }
            },
            credits: { enabled: true },     // på den siste, nederste grafen bør denne skrus på
            
            time: { 
                useUTC: true 
            },

            // Bygger x- og y-akser fra utmodulariserte metoder
            xAxis: buildWindXAxis({ data, dayBands, getLocalHour, formatLocalDate }),
            yAxis: buildWindYAxis(maxGust),
             
            tooltip: {
                shared: true,
                valueSuffix: " m/s"
            },

            legend: {
                verticalAlign: "bottom",
                align: "center",
                y: 10,

                itemStyle: { 
                    fontWeight: "bold", 
                    fontSize: "14px" 
                }
            },

            plotOptions: {
                spline: {
                    lineWidth: 2.5,
                    marker: { radius: 2 }
                }
            },

            series: [
                {
                    name: "Vind",
                    type: "spline",
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
                    zIndex: 3
                }
            ]
        };
    }, [hourlyData, getLocalHour, formatLocalDate]);

    if (!options) {
        return null;
    }

    return <HighchartsReact highcharts={Highcharts} options={options} />;
}