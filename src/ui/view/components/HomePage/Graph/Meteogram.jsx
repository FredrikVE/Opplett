// src/ui/view/components/HomePage/Graph/Meteogram.jsx
import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import { mapHourlyForecastToMeteogram } from './graphUtils/mapHourlyForecastToMeteogram.js';
import { buildDayBands } from './graphUtils/dayBands.js';

import { buildXAxis } from './graphConfig/xAxis.js';
import { buildYAxis } from './graphConfig/yAxis.js';
import { buildSeries } from './graphConfig/series.js';
import { buildTooltip } from './graphConfig/tooltip.js';
import { buildPlotOptions } from './graphConfig/plotOptions.js';

export default function Meteogram({ hourlyData, getLocalHour, formatLocalDateTime, formatLocalDate }) {
    
    const options = useMemo(() => {
        if (!hourlyData?.length) {
            return null;
        }

        // Domene, graf-datasett (Nå inkludert weatherSymbols)
        const data = mapHourlyForecastToMeteogram(hourlyData, getLocalHour);

        // Visuell gruppering (dager / zebra-striper)
        const dayBands = buildDayBands(data.firstTimestamp, data.lastTimestamp, data.midnights);

        // Highcharts-konfigurasjon
        return {
            chart: {
                height: 450, // Økt fra 380 for å gi plass til værsymboler og mer "luft"
                backgroundColor: 'transparent',
                spacingTop: 10,    // Ekstra luft i toppen over ikonene
                spacingBottom: 20,
                spacingLeft: 0,
                spacingRight: 0,
                style: { fontFamily: 'inherit' }
            },
            time: { useUTC: true },
            title: { text: null },
            credits: { enabled: false },

            // Bygger x- og y-akser
            xAxis: buildXAxis(data, dayBands, getLocalHour, formatLocalDate),
            yAxis: buildYAxis(data.midnights),
            plotOptions: buildPlotOptions(),

            //bygger serie med værikoner øverst
            series: buildSeries(data),

            //Tooltip: full dato + klokkeslett
            tooltip: buildTooltip(formatLocalDateTime),

            legend: {
                verticalAlign: 'top',
                align: 'center',
                itemStyle: {
                    fontWeight: 'bold',
                    fontSize: '12px'
                },
                // Margin for å dytte legend litt ned så den ikke klistrer seg i toppen
                margin: 10 
            }
        };
    }, [
        hourlyData,
        getLocalHour,
        formatLocalDateTime,
        formatLocalDate
    ]);

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