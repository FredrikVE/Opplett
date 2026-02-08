
//src/ui/view/components/HomePage/Graph/graphUtils/mapHourlyForecastToMeteogram.js
export function mapHourlyForecastToMeteogram(hourlyData, getLocalHour) {
	if (!hourlyData?.length) {
		return null;
	}

	const firstTimestamp = Date.parse(hourlyData[0].timeISO);
	const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

	const temperature = [];
	const rain = [];
	const rainExtra = [];
	const midnights = [];

	hourlyData.forEach(h => {
		const time = Date.parse(h.timeISO);
		const hour = getLocalHour(time);

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
		firstTimestamp,
		lastTimestamp,
		temperature,
		rain,
		rainExtra,
		midnights
	};
}
