//src/ui/view/components/HomePage/Graph/UVGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapHourlyForecastToUV } from "./graphUtils/mapHourlyForecastToUV";
import { buildCommonChartConfig } from "./graphConfig/chartConfig";
import { buildDayBands } from "./graphUtils/dayBands";

import { buildUVXAxis } from "./graphConfig/uv/xAxisUV";
import { buildUVYAxis } from "./graphConfig/uv/yAxisUV";

export default function UVGraph({ hourlyData, getLocalHour, formatLocalDate }) {
    
    const options = useMemo(() => {
        const data = mapHourlyForecastToUV(hourlyData, getLocalHour);
        
        if (!data) {
            return null;
        }

        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        return {
            chart: {
                ...buildCommonChartConfig(),
                type: 'column'
            },
            title: {
                text: "UV-indeks",
                style: { fontWeight: "bold", fontSize: "20px" }
            },
            credits: { enabled: false },
            time: { useUTC: true },

            xAxis: buildUVXAxis({ data, dayBands, getLocalHour, formatLocalDate }),
            yAxis: buildUVYAxis(),

            plotOptions: {
                column: {
                    borderWidth: 0,
                    pointPadding: 0.1,
                    groupPadding: 0.05,
                    borderRadius: 2,
                    // Hindrer at søyler "fader ut" hvis man hoover over andre serier
                    states: {
                        inactive: { opacity: 1 }
                    }
                }
            },
            
            tooltip: {
                shared: true,
                valueDecimals: 1,
            },

            series: [{
                name: 'UV-indeks',
                data: data.uvData,
                showInLegend: false
            }]
        };
    }, [hourlyData, getLocalHour, formatLocalDate]);

    if (!options) {
        return null;
    }

    return (
        <div className="uv-graph-container" style={{ marginBottom: "20px" }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}