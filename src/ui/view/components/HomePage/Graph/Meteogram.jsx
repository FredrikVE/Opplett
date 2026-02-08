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

		//Domene, graf-datasett (ingen tidssone, ingen Intl)
		const data = mapHourlyForecastToMeteogram(
			hourlyData,
			getLocalHour
		);

		//Visuell gruppering (dager / zebra-striper)
		const dayBands = buildDayBands(
			data.firstTimestamp,
			data.lastTimestamp,
			data.midnights
		);

		//Highcharts-konfigurasjon
		return {
			chart: {
				height: 380,
				backgroundColor: 'transparent',
				spacingBottom: 40,
				style: { fontFamily: 'inherit' }
			},
			time: { useUTC: true },
			title: { text: null },
			credits: { enabled: false },

			//X-akse: timer + dato (all tid injisert)
			xAxis: buildXAxis(
				data,
				dayBands,
				getLocalHour,
				formatLocalDate
			),

			//Y-akser
			yAxis: buildYAxis(data.midnights),

			plotOptions: buildPlotOptions(),

			series: buildSeries(data),

			//Tooltip: full dato + klokkeslett
			tooltip: buildTooltip(formatLocalDateTime),

			legend: {
				verticalAlign: 'top',
				itemStyle: {
					fontWeight: 'bold'
				}
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
