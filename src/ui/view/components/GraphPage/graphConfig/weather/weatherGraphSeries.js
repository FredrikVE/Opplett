//src/ui/view/components/GraphPage/graphConfig/weather/weatherGraphSeries.js
import { COLORS } from "../constants.js";
import { getWeatherIconFileName } from "../../../../../utils/weatherIcons.js";

function buildWeatherSymbolSeries(symbolData) {
	if (!symbolData || symbolData.length === 0) {
		return {
			type: "scatter",
			data: []
		};
	}

	const weatherSymbolPoints = symbolData
		.map((symbol) => {

			const iconFileName = getWeatherIconFileName(symbol.symbolCode);
			if (!iconFileName) {
                return null;
            }

			const iconUrl = `/weather_icons/200/${iconFileName}`;

			return {
				x: symbol.x,
				y: 0.5,
				marker: {
					symbol: `url(${iconUrl})`,
					width: 32,
					height: 32
				}
			};
		})
		.filter(Boolean);

	return {
		name: "Vær",
		type: "scatter",
		data: weatherSymbolPoints,
		yAxis: 2,
		zIndex: 5,
		enableMouseTracking: false,
		showInLegend: false,
		pointPlacement: "on",
		clip: false,
		dataLabels: { enabled: false }
	};
}

export function buildForecastLayers(data) {
	return [

		buildWeatherSymbolSeries(data.weatherSymbols),

		{
			name: "Temperatur",
			type: "areaspline",
			data: data.temperature,
			zIndex: 3,
			pointPlacement: "on",
			tooltip: {
				valueSuffix: "°C"
			}
		},

		//Forventet nedbør
		{
			name: "Nedbør",
			type: "column",
			data: data.rain,
			yAxis: 1,
			color: COLORS.rainExpected,
			zIndex: 1,
			pointPlacement: "on",
			stacking: "normal",
			tooltip: {
				valueSuffix: " mm"
			}
		},

		//Mulig nedbør (samme design-system)
		{
			name: "Mulig nedbør",
			type: "column",
			data: data.rainExtra,
			yAxis: 1,
			pointPlacement: "on",
			stacking: "normal",
			zIndex: 2,
			color: {
				pattern: {
					path: {
						d: "M 0 8 L 8 0",
						strokeWidth: 1
					},

					color: COLORS.rainPossible
				}
			},
			borderWidth: 0,
			tooltip: {
				valueSuffix: " mm"
			}
		}
	];
}
