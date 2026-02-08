//src/ui/view/components/HomePage/Graph/Meteogram.jsx
import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/* =======================
	Farger og konstanter
======================= */

const COLORS = {
	tempPositive: '#dd4141',
	tempNegative: '#0078ff',
	rainExpected: '#5DADE2',
	rainPossible: '#AED6F1',
	zebraBand: 'rgba(248,249,250,0.8)',
	text: '#111',
	textMuted: '#666'
};

const HOUR = 3600 * 1000;

/* =======================
	Temperatur-soner
======================= */

function getTempZones() {
	return [
		{
			value: 0,
			color: COLORS.tempNegative,
			fillColor: {
				linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
				stops: [
					[0, 'rgba(0,120,255,0)'],
					[1, 'rgba(0,120,255,0.3)']
				]
			}
		},
		{
			color: COLORS.tempPositive,
			fillColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, 'rgba(221,65,65,0.3)'],
					[1, 'rgba(221,65,65,0)']
				]
			}
		}
	];
}

/* =======================
	Data-prepping
======================= */
function prepareMeteogramData(hourlyData, timezone) {
	const tz =
		timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

	const formatLocal = (ts, options) =>
		new Date(ts).toLocaleString('nb-NO', {
			...options,
			timeZone: tz
		});

	const firstTimestamp = Date.parse(hourlyData[0].timeISO);
	const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

	const temperature = [];
	const rain = [];
	const rainExtra = [];
	const midnights = [];

	hourlyData.forEach(h => {
		const time = Date.parse(h.timeISO);
		const hour = Number(
			formatLocal(time, {
				hour: 'numeric',
				hour12: false
			})
		);

		if (hour === 0) {
			midnights.push(time);
		}

		temperature.push([time, h.temp]);
		rain.push([time, h.precipitation.amount]);

		const max =
			h.precipitation.maxAmount ??
			h.precipitation.amount;

		rainExtra.push([
			time,
			Math.max(max - h.precipitation.amount, 0)
		]);
	});

	return {
		formatLocal,
		firstTimestamp,
		lastTimestamp,
		temperature,
		rain,
		rainExtra,
		midnights
	};
}

/* =======================
	Dager og zebra-striper
======================= */

function buildDayBands(first, last, midnights) {
	const boundaries = [first, ...midnights, last];

	return boundaries.slice(0, -1).map((from, i) => {
		const to = boundaries[i + 1];

		return {
			from,
			to,
			mid: from + (to - from) / 2,
			zebra: i % 2 === 1
		};
	});
}

function buildZebraBands(dayBands) {
	return dayBands
		.filter(d => d.zebra)
		.map(d => ({
			from: d.from,
			to: d.to,
			color: COLORS.zebraBand,
			zIndex: 0
		}));
}

/* =======================
	Highcharts builders
======================= */

function buildXAxis(data, dayBands) {
	return [
		{
			type: 'datetime',
			min: data.firstTimestamp,
			max: data.lastTimestamp,
			tickInterval: 6 * HOUR,
			lineColor: COLORS.text,
			lineWidth: 1.5,
			tickColor: COLORS.text,
			plotBands: buildZebraBands(dayBands),
			labels: {
				style: {
					color: COLORS.textMuted,
					fontWeight: 'bold',
					fontSize: '11px'
				},
				formatter() {
					const hour = Number(
						data.formatLocal(this.value, {
							hour: 'numeric',
							hour12: false
						})
					);

					return hour === 0 ? '' : hour;
				}
			}
		},
		{
			linkedTo: 0,
			type: 'datetime',
			lineWidth: 0,
			tickWidth: 0,
			tickPositions: dayBands.map(d => d.mid),
			labels: {
				align: 'center',
				y: 28,
				style: {
					color: COLORS.text,
					fontWeight: 'bold',
					fontSize: '12px'
				},
				formatter() {
					const band = dayBands.find(
						d =>
							this.value >= d.from &&
							this.value <= d.to
					);

					return band
						? data.formatLocal(band.from, {
								weekday: 'short',
								day: 'numeric',
								month: 'short'
						  })
						: '';
				}
			}
		}
	];
}

function buildYAxis(midnights) {
	return [
		{
			title: { text: null },
			gridLineWidth: 0,
			lineColor: COLORS.text,
			lineWidth: 1.5,
			labels: {
				format: '{value}°',
				style: {
					color: COLORS.textMuted,
					fontWeight: 'bold'
				}
			},
			plotLines: [
				{
					value: 0,
					color: '#ccc',
					dashStyle: 'Dash',
					width: 1
				},
				...midnights.map(t => ({
					value: t,
					color: '#ddd',
					width: 1,
					zIndex: 1
				}))
			]
		},
		{
			title: { text: null },
			opposite: true,
			min: 0,
			gridLineWidth: 0,
			lineColor: COLORS.text,
			lineWidth: 1.5,
			labels: {
				format: '{value} mm',
				style: {
					color: COLORS.textMuted,
					fontSize: '10px',
					fontWeight: 'bold'
				}
			}
		}
	];
}

function buildSeries(data) {
	return [
		{
			name: 'Temperatur',
			type: 'areaspline',
			data: data.temperature,
			zIndex: 3
		},
		{
			name: 'Nedbør',
			type: 'column',
			data: data.rain,
			yAxis: 1,
			color: COLORS.rainExpected,
			zIndex: 2
		},
		{
			name: 'Mulig ekstra',
			type: 'column',
			data: data.rainExtra,
			yAxis: 1,
			color: COLORS.rainPossible,
			zIndex: 1
		}
	];
}

function buildTooltip(formatLocal) {
	return {
		shared: true,
		useHTML: true,
		backgroundColor: 'rgba(255,255,255,0.95)',
		borderRadius: 10,
		shadow: false,
		formatter() {
			const date = formatLocal(this.x, {
				weekday: 'long',
				day: 'numeric',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			});

			return `
				<div style="font-size:12px;color:#333">
					<div style="font-weight:600;margin-bottom:6px">
						${date}
					</div>
					${this.points
						.map(
							p => `
						<div>
							${p.series.name}:
							<b>
								${p.y.toFixed(1)}${
									p.series.name === 'Temperatur'
										? '°C'
										: ' mm'
								}
							</b>
						</div>
					`
						)
						.join('')}
				</div>
			`;
		}
	};
}

/* =======================
	React-komponenten
======================= */

export default function Meteogram({ hourlyData, timezone }) {
	const options = useMemo(() => {
		if (!hourlyData?.length) {
			return null;
		}

		const data = prepareMeteogramData(
			hourlyData,
			timezone
		);

		const dayBands = buildDayBands(
			data.firstTimestamp,
			data.lastTimestamp,
			data.midnights
		);

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

			xAxis: buildXAxis(data, dayBands),
			yAxis: buildYAxis(data.midnights),

			plotOptions: {
				areaspline: {
					marker: { enabled: false },
					lineWidth: 2.5,
					threshold: null,
					zones: getTempZones()
				},
				column: {
					stacking: 'normal',
					borderWidth: 0,
					borderRadius: 3,
					pointRange: HOUR,
					groupPadding: 0.1
				}
			},

			series: buildSeries(data),
			tooltip: buildTooltip(data.formatLocal),

			legend: {
				verticalAlign: 'top',
				itemStyle: {
					color: COLORS.text,
					fontWeight: 'bold'
				}
			}
		};
	}, [hourlyData, timezone]);

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
