//src/ui/view/components/HomePage/Graph/WeatherGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapHourlyForecastToMeteogram } from "./graphUtils/mapHourlyForecastToMeteogram.js";
import { buildDayBands } from "./graphUtils/dayBands.js";

import { buildWeatherXAxis } from "./graphConfig/xAxisWeather.js";
import { buildWeatherYAxis } from "./graphConfig/yAxisWeather.js";
import { buildForecastLayers } from "./graphConfig/weatherGraphSeries.js";
import { buildPlotOptions } from "./graphConfig/plotOptions.js";
import { buildCommonChartConfig } from "./graphConfig/chartConfig.js";

export default function WeatherGraph({ hourlyData, getLocalHour, formatLocalDate }) {
    
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

            tooltip: {
                shared: true,
                split: false,
                followPointer: true 
            },
            
            credits: { enabled: false },

            xAxis: buildWeatherXAxis(data, dayBands, getLocalHour, formatLocalDate),
            yAxis: buildWeatherYAxis(data.midnights),
            plotOptions: buildPlotOptions(),
            series: buildForecastLayers(data),
            
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