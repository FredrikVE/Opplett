// src/ui/view/components/HomePage/Graph/WindMeteogram.jsx
import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import { mapHourlyForecastToWind } from './graphUtils/mapHourlyForecastToWind';
import { buildDayBands } from './graphUtils/dayBands';
import { buildWindXAxis } from './graphConfig/windXAxis';
import { COLORS } from './graphConfig/constants';

export default function WindMeteogram({ hourlyData, getLocalHour, formatLocalDate }) {
    const options = useMemo(() => {
        
        const data = mapHourlyForecastToWind(hourlyData, getLocalHour);
        
        if (!data) {
            return null;
        }

        const noWind =
            data.wind.every(([, v]) => v === 0) &&
            data.gust.every(([, v]) => v === 0);

        // Samme daginndeling som meteogrammet
        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        // Felles konfigurasjon for å sikre at grafene flukter vertikalt
        const commonChartConfig = {
            height: 450,
            backgroundColor: 'transparent',
            spacingTop: 10,
            spacingBottom: 20,
            spacingLeft: 0,
            spacingRight: 0,
            // Ved å sette faste marginer tvinger vi x-aksen til å starte og slutte på samme sted
            marginLeft: 50, 
            marginRight: 50,
            style: { fontFamily: 'inherit' }
        };

        // --- Ingen vind i perioden ---
        if (noWind) {
            return {
                chart: commonChartConfig,
                title: { text: 'Vind (m/s)' },
                subtitle: {
                    text: 'Ingen målbar vind i perioden 🌬️',
                    style: { color: COLORS.textMuted }
                },
                credits: { enabled: false }
            };
        }

        const maxGust = Math.max(...data.gust.map(([, v]) => v));

        return {
            chart: commonChartConfig,

            title: {
                text: 'Vind (m/s)',
                style: {
                    fontWeight: 'bold',
                    fontSize: '14px'
                }
            },

            credits: { enabled: false },
            time: { useUTC: true },

            // Samme x-akse-kontrakt som meteogrammet
            xAxis: buildWindXAxis({
                data,
                dayBands,
                getLocalHour,
                formatLocalDate
            }),

            yAxis: [
                {
                    // VENSTRE AKSE: Vindstyrke
                    min: 0,
                    softMax: maxGust + 1,
                    tickAmount: 5,
                    lineColor: COLORS.text,
                    lineWidth: 1.5,
                    gridLineWidth: 0,
                    title: { text: null },
                    labels: {
                        format: '{value} m/s',
                        style: {
                            color: COLORS.textMuted,
                            fontWeight: 'bold',
                            fontSize: '11px'
                        }
                    }
                },
                {
                    // HØYRE AKSE: "Skygge-akse" for å matche nedbørsaksen i Meteogrammet
                    opposite: true,
                    linkedTo: 0,
                    gridLineWidth: 0,
                    lineColor: COLORS.text,
                    lineWidth: 0,           // gjør den sekundære aksen på HS av vindchart usynlig
                }
            ],

            tooltip: {
                shared: true,
                valueSuffix: ' m/s'
            },

            legend: {
                verticalAlign: 'bottom',
                align: 'center',
                y: 10,
                itemStyle: {
                    fontWeight: 'bold',
                    fontSize: '11px'
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
                    name: 'Vind',
                    type: 'spline',
                    data: data.wind,
                    color: COLORS.wind,
                    zIndex: 2
                },
                {
                    name: 'Vindkast',
                    type: 'spline',
                    data: data.gust,
                    color: COLORS.windGust,
                    dashStyle: 'ShortDot',
                    zIndex: 3
                }
            ]
        };
    }, [hourlyData, getLocalHour, formatLocalDate]);

    if (!options) {
        return null;
    }

    return (
        <HighchartsReact
            highcharts={Highcharts}
            options={options}
        />
    );
}