//src/ui/view/components/HomePage/Graph/graphConfig/series.js
import { COLORS } from "./constants.js";

export function buildSeries(data) {
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
