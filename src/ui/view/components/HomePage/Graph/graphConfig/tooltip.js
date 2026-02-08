//src/ui/view/components/HomePage/Graph/graphConfig/tooltip.js
export function buildTooltip(formatLocal) {
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
