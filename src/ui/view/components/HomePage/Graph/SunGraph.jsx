// src/ui/view/components/HomePage/Graph/SunGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { mapSunData } from "./graphUtils/mapSunData.js";
import { buildSunXAxis } from "./graphConfig/sun/xAxisSun.js";
import { buildSunYAxis } from "./graphConfig/sun/yAxisSun.js";
import { buildSunSeries } from "./graphConfig/sun/sunSeries.js";
import { buildSunPlotOptions } from "./graphConfig/sun/plotOptionsSun.js";
import { buildCommonChartConfig } from "./graphConfig/chartConfig.js";

export default function SunGraph({ sunTimesByDate, formatLocalDate }) {
    const options = useMemo(() => {
        const data = mapSunData(sunTimesByDate);
        if (!data?.length) return null;

        // Finn laveste verdi for å sette en smart start-skala
        const minVal = Math.min(...data.map(d => d.prevY));
        const floorMin = Math.floor(minVal - 1);
        const axisMin = floorMin > 0 ? floorMin : 0;

        return {
            chart: {
                ...buildCommonChartConfig(),
                type: "column"
            },
            title: { 
                text: "Dagslengde", 
                align: 'left',
                style: { fontWeight: "bold", fontSize: "18px" } 
            },
            credits: { enabled: true },     // på den siste, nederste grafen bør denne skrus på
            time: { useUTC: true },

            xAxis: buildSunXAxis(formatLocalDate),
            yAxis: buildSunYAxis(axisMin),
            plotOptions: buildSunPlotOptions(axisMin),
            series: buildSunSeries(data),

            tooltip: {
                shared: true,
                distance: 40,
                outside: true,
                formatter() {
                    const currentX = this.x;
                    const totalData = data.find(d => d.x === currentX);
                    
                    return `<b>${formatLocalDate(currentX)}</b><br/>
                            Total dagslengde: <b>${totalData?.fullDisplay || ''}</b><br/>
                            Endring: <b>${totalData?.diffText || ''}</b>`;
                }
            }
        };
    }, [sunTimesByDate, formatLocalDate]);

    if (!options) {
        return null;
    }

    return (
        <div className="sun-graph-container" style={{ marginTop: '30px' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}