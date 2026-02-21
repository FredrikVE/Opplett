//src/ui/view/components/GraphPage/graphUtils/mapHourlyForecastToMeteogram.js
export function mapHourlyForecastToMeteogram(hourlyData, getLocalHour) {
	
	if (!hourlyData?.length) {
		return null;
	}

	const firstTimestamp = Date.parse(hourlyData[0].timeISO);
	const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

	const temperature = [];
	const rainExpected = [];
	const rainMax = [];
	const weatherSymbols = [];
	const midnights = [];

	const symbolInterval = 3;

	hourlyData.forEach((h, index) => {
		const time = Date.parse(h.timeISO);
		const hour = getLocalHour(time);

		if (hour === 0) {
			midnights.push(time);
		}

		// Temperatur
		temperature.push([time, h.temp]);

		// Nedbør
		const amount = h.precipitation?.amount ?? 0;
		const max = h.precipitation?.max ?? amount;

		rainExpected.push([time, amount]);
		rainMax.push([time, max]);

		// Værsymboler
		if (index % symbolInterval === 0 || index === 0) {
			weatherSymbols.push({
				x: time,
				y: 0,
				symbolCode: h.weatherSymbol
			});
		}
	});

	return {
		firstTimestamp,
		lastTimestamp,
		temperature,
		rainExpected,
		rainMax,
		weatherSymbols,
		midnights
	};
}
