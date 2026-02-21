//src/ui/view/components/GraphPage/WindGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { COLORS } from "./graphConfig/constants";

import { mapHourlyForecastToWind } from "./graphUtils/mapHourlyForecastToWind";
import { buildCommonChartConfig } from "./graphConfig/chartConfig";
import { buildDayBands } from "./graphUtils/dayBands";

import { createTooltipFormatter } from "./graphUtils/tooltipFormatter";
import { buildWindPlotOptions } from "./graphConfig/wind/plotOptionsWind";
import { buildWindSeries } from "./graphConfig/wind/windSeries";

import { buildWindXAxis } from "./graphConfig/wind/xAxisWind";
import { buildWindYAxis } from "./graphConfig/wind/yAxisWind";


export default function WindGraph({ hourlyData, getLocalHour, formatLocalDate, formatLocalDateTime }) {
    
    const options = useMemo(() => {
        const data = mapHourlyForecastToWind(hourlyData, getLocalHour);
        
        if (!data) {
            return null;
        }

        const noWind = data.wind.every(([, v]) => v === 0) && data.gust.every(([, v]) => v === 0);
        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        if (noWind) {
            return {
                chart: buildCommonChartConfig(),
                title: { text: "Vind (m/s)" },
                subtitle: {
                    text: "Ingen målbar vind i perioden",
                    style: { color: COLORS.textMuted }
                },
                credits: { enabled: false }
            };
        }

        return {
            chart: buildCommonChartConfig(),
            title: {
                text: "Vind (m/s)",
                style: { fontWeight: "bold", fontSize: "20px" }
            },
            credits: { enabled: false },
            time: { useUTC: true },

            xAxis: buildWindXAxis({ data, dayBands, getLocalHour, formatLocalDate }),
            yAxis: buildWindYAxis(Math.max(...data.gust.map(([, v]) => v))),
            
            plotOptions: buildWindPlotOptions(),
            series: buildWindSeries(data),
             
            tooltip: {
                shared: true,
                formatter: function() {
                    return createTooltipFormatter(this, formatLocalDateTime)
                }
                
            },

            legend: {
                verticalAlign: "bottom",
                align: "center",
                y: 10,
                itemStyle: { fontWeight: "bold", fontSize: "14px" }
            }
        };
    }, 
    
    [hourlyData, getLocalHour, formatLocalDate, formatLocalDateTime]);

    if (!options) {
        return null;
    }

    return(
        <HighchartsReact highcharts={Highcharts} options={options} />
    );
}