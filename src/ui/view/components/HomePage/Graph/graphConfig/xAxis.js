// src/ui/view/components/HomePage/Graph/graphConfig/xAxis.js

import { COLORS, HOUR } from "./constants.js";
import { buildZebraBands } from "../graphUtils/dayBands.js";

export function buildXAxis(data, dayBands, getLocalHour, formatLocalDate) {
	return [
		{
			// Primær akse: timer
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
					if (typeof getLocalHour !== 'function') {
						return '';
					}

					const hour = getLocalHour(this.value);
					return hour;
				}
			}
		},
		{
			// Sekundær akse: dato (én label per dag, midtstilt)
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
					if (typeof formatLocalDate !== 'function') {
						return '';
					}

					const band = dayBands.find(d =>
						this.value >= d.from &&
						this.value <= d.to
					);

					return band
						? formatLocalDate(band.from)
						: '';
				}
			}
		}
	];
}
