//src/ui/view/components/HomePage/Graph/graphUtils/dayBands.js
import { COLORS } from '../graphConfig/constants';

export function buildDayBands(first, last, midnights) {
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

export function buildZebraBands(dayBands) {
	return dayBands
		.filter(d => d.zebra)
		.map(d => ({
			from: d.from,
			to: d.to,
			color: COLORS.zebraBand,
			zIndex: 0
		}));
}
