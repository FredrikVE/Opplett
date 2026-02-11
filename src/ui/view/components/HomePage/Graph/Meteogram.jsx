// src/ui/view/components/HomePage/Graph/Meteogram.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapHourlyForecastToMeteogram } from "./graphUtils/mapHourlyForecastToMeteogram.js";
import { buildDayBands } from "./graphUtils/dayBands.js";

import { buildXAxis } from "./graphConfig/xAxis.js";
import { buildYAxis } from "./graphConfig/yAxis.js";
import { buildSeries } from "./graphConfig/series.js";
import { buildPlotOptions } from "./graphConfig/plotOptions.js";
import { buildCommonChartConfig } from "./graphConfig/chartConfig.js";

export default function Meteogram({ hourlyData, getLocalHour, formatLocalDate }) {
    
    const options = useMemo(() => {

        if (!hourlyData?.length) {
            return null;
        }

        const data = mapHourlyForecastToMeteogram(hourlyData, getLocalHour);
        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        return {
            chart: buildCommonChartConfig(), 

            time: { useUTC: true },
            title: {
                text: "Vær",
                style: { 
                    fontWeight: "bold", 
                    fontSize: "20px" 
                }
            },
            credits: { enabled: false },

            xAxis: buildXAxis(data, dayBands, getLocalHour, formatLocalDate),
            yAxis: buildYAxis(data.midnights),
            plotOptions: buildPlotOptions(),
            series: buildSeries(data),

            legend: {
                verticalAlign: "top",
                align: "center",
                itemStyle: { fontWeight: "bold", fontSize: "12px" },
                margin: 10 
            }
        };
    }, [hourlyData, getLocalHour, formatLocalDate]);

    if (!options) {
        return null;
    }

    return( 
    <HighchartsReact highcharts={Highcharts} options={options} />
    );
}