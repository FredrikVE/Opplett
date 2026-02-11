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

        // Finn laveste verdi for å sette en smart start-skala
        const minVal = Math.min(...data.map(d => d.prevY));
        
        // Vi setter bunnen av grafen til f.eks. 2 timer under laveste punkt, 
        // men runder ned til nærmeste partall for en ryddig y-akse.
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
            credits: { enabled: false },
            time: { useUTC: true },
            xAxis: {
                type: "datetime",
                tickInterval: 24 * 3600 * 1000,
                labels: {
                    formatter() { return formatLocalDate(this.value).split(" ")[0]; },
                    style: { fontWeight: "bold", color: COLORS.textMuted }
                }
            },
            yAxis: { 
                visible: true,
                title: { text: null },
                min: axisMin, // Zoomer inn slik at vi ser trappetrinnene
                tickInterval: 1, // Viser hver time for bedre detaljer når vi har zoomet
                gridLineDashStyle: 'Dash',
                labels: {
                    format: "{value} t",
                    style: { color: COLORS.textMuted, fontWeight: "bold" }
                },
                lineWidth: 1.5,
                lineColor: '#ccd6eb'
            },
            plotOptions: {
                column: {
                    grouping: false,
                    borderWidth: 0,
                    pointPadding: 0.1,
                    threshold: axisMin, // Søylene tegnes fra det nye bunnpunktet
                    states: {
                        inactive: { opacity: 1 }
                    }
                }
            },
            series: [
                {
                    name: "Total lengde",
                    data: data.map(d => ({ 
                        x: d.x, 
                        y: d.y, 
                        diffText: d.diffText, 
                        fullDisplay: d.fullDisplay 
                    })),
                    color: "#ef6c00", 
                    zIndex: 1,
                    enableMouseTracking: false,
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        y: -18,
                        formatter() {
                            return `<div style="color: #ef6c00; font-size: 10px; font-weight: bold; text-align: center;">
                                        ${this.point.diffText}
                                    </div>`;
                        }
                    }
                },
                {
                    name: "Gårsdagens lengde",
                    data: data.map(d => ({ x: d.x, y: d.prevY })),
                    color: "#fbc02d", 
                    zIndex: 2,
                    showInLegend: false,
                    borderRadius: 0,
                    states: {
                        hover: {
                            enabled: true,
                            brightness: 0.1
                        }
                    }
                }
            ],
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

    if (!options) return null;

    return (
        <div className="sun-graph-container" style={{ marginTop: '30px' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}