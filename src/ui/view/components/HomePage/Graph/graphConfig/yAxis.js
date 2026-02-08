//src/ui/view/components/HomePage/Graph/graphConfig/yAxis.js
import { COLORS} from "./constants.js";

export function buildYAxis(midnights) {
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
