//src/ui/view/components/GraphPage/graphConfig/weather/plotWeatherOptions.js
import { HOUR, COLORS } from '../constants';

export function getTempZones() {
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

export function buildWeatherPlotOptions() {
	return {
		areaspline: {
			marker: { enabled: false },
			lineWidth: 2.5,
			threshold: null,
			zones: getTempZones()
		},
		column: {
			stacking: 'normal',		// Beholder stacking-modellen
			borderWidth: 0,			// Ingen kant
			borderRadius: 3,		// Myke hjørner
			pointRange: HOUR,		// 1 time bredde
			groupPadding: 0.1,
			states: {
				hover: {
					brightness: 0	// Hindrer at hover ødelegger kontrasten
				}
			}
		}
	};
}
