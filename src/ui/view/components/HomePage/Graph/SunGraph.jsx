// src/ui/view/components/HomePage/Graph/SunGraph.jsx
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { mapSunData } from "./graphUtils/mapSunData";
import { buildCommonChartConfig } from "./graphConfig/chartConfig";
import { COLORS } from "./graphConfig/constants";

export default function SunGraph({ sunTimesByDate, formatLocalDate }) {
    const options = useMemo(() => {
        const data = mapSunData(sunTimesByDate);

        if (data.length === 0) return null;

        return {
            chart: buildCommonChartConfig(),
            title: {
                text: "Dagslengde",
                style: { fontWeight: "bold", fontSize: "18px" }
            },
            time: { useUTC: true },
            credits: { enabled: false },
            
            xAxis: {
                type: 'datetime',
                tickInterval: 24 * 3600 * 1000, // En tick per dag
                labels: {
                    formatter() {
                        return formatLocalDate ? formatLocalDate(this.value).split(' ')[0] : "";
                    },
                    style: { color: COLORS.textMuted, fontWeight: "bold" }
                }
            },

            yAxis: {
                title: { text: null },
                min: 0,
                gridLineDashStyle: 'Dash',
                labels: {
                    format: "{value} t",
                    style: { color: COLORS.textMuted }
                }
            },

            tooltip: {
                shared: true,
                formatter: function() {
                    const point = this.points[0].point;
                    const dateStr = formatLocalDate(point.x);
                    return `<b>${dateStr}</b><br/>Dagslengde: ${point.displayLabel}`;
                }
            },

            series: [{
                name: "Dagslys",
                type: "column", // Column gir ofte det tydeligste bildet av dagslengde
                data: data,
                color: "#fbc02d", // En varm gulfarge
                borderRadius: 4,
                showInLegend: false
            }]
        };
    }, [sunTimesByDate, formatLocalDate]);

    if (!options) return null;

    return (
        <div className="sun-graph-container" style={{ marginTop: '20px' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}