//src/ui/view/components/GraphPage/graphUtils/mapHourlyForecastToMeteogram.js
export function mapHourlyForecastToMeteogram(hourlyData, getLocalHour) {
	if (!hourlyData?.length) {
		return null;
	}

	const firstTimestamp = Date.parse(hourlyData[0].timeISO);
	const lastTimestamp = Date.parse(hourlyData.at(-1).timeISO);

	const temperature = [];
	const rain = [];
	const rainExtra = [];
	const weatherSymbols = [];
	const midnights = [];

	const symbolInterval = 3;

	hourlyData.forEach((h, index) => {
		const time = Date.parse(h.timeISO);
		const hour = getLocalHour(time);

		if (hour === 0) {
			midnights.push(time);
		}

		// 1️⃣ Temperatur
		temperature.push([time, h.temp]);

		// 2️⃣ Forventet nedbør
		const amount = h.precipitation?.amount ?? 0;
		rain.push([time, amount]);

		// 3️⃣ Mulig ekstra (usikkerhet opp til max)
		const max = h.precipitation?.max ?? amount;
		rainExtra.push([
			time,
			max
		]);

		// 4️⃣ Værsymboler
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
		rain,
		rainExtra,
		weatherSymbols,
		midnights
	};
}
