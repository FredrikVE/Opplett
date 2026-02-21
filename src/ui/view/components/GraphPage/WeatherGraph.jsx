//src/ui/view/components/GraphPage/WeatherGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapHourlyForecastToMeteogram } from "./graphUtils/mapHourlyForecastToMeteogram.js";
import { buildDayBands } from "./graphUtils/dayBands.js";
import { buildCommonChartConfig } from "./graphConfig/chartConfig.js";

import { buildWeatherXAxis } from "./graphConfig/weather/xAxisWeather.js";
import { buildWeatherYAxis } from "./graphConfig/weather/yAxisWeather.js";
import { buildForecastLayers } from "./graphConfig/weather/weatherGraphSeries.js";
import { buildWeatherPlotOptions } from "./graphConfig/weather/plotWeatherOptions.js";
import { createTooltipFormatter } from "./graphUtils/tooltipFormatter.js";

export default function WeatherGraph({ hourlyData, getLocalHour, formatLocalDate, formatLocalDateTime }) {
    
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
				followPointer: true,
				formatter: function () {
					//Bruker tooltipFormatter for å få riktig lokaltid i infoboksen
					return createTooltipFormatter(this, formatLocalDateTime);
				}
			},
            
            credits: { enabled: false },

            xAxis: buildWeatherXAxis(data, dayBands, getLocalHour, formatLocalDate),
            yAxis: buildWeatherYAxis(data.midnights),
            plotOptions: buildWeatherPlotOptions(),
            series: buildForecastLayers(data),
            
            legend: {
                verticalAlign: "top",
                align: "center",
                itemStyle: { fontWeight: "bold", fontSize: "12px" },
                margin: 10 
            }
        };
    }, [hourlyData, getLocalHour, formatLocalDate, formatLocalDateTime]);

    if (!options) {
        return null;
    }

    return( 
        <HighchartsReact highcharts={Highcharts} options={options} />
    );
}