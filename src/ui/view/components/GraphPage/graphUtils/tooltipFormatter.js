//src/ui/view/components/GraphPage/graphUtils/tooltipFormatter.js

export function createTooltipFormatter(context, formatLocalDateTime) {
	//Hent ut data fra Highcharts-konteksten
	const x = context.x;
	const points = context.points;

	//Lag overskriften med tid og dato
	const header = `<b>${formatLocalDateTime(x)}</b>`;

	//Formater hver linje (serie) for seg selv
	const rows = points
		.filter(point => point.y !== null && point.y !== undefined)
		.map(point => {
			const name = point.series.name;
			const suffix = point.series.tooltipOptions?.valueSuffix || "";
			const value = point.y;
			
			return `${name}: <b>${value}${suffix}</b>`;
		});

	//Sett sammen alt med linjeskift <br/>
	return `${header}<br/>${rows.join("<br/>")}`;
}