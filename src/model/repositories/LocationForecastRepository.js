// src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
	
	//Konstruktør som tar inn locationdatasource og lagrer et map for cahce.
	constructor(locationForecastDataSource) {
		this.datasource = locationForecastDataSource;

		// Cache for rå timeseries
		// key: `${lat},${lon},${hoursAhead}`
		this._rawCache = new Map();
	}

	// @@@ Private hjelpemetoder @@@ //
	async #getRawTimeSeries(lat, lon, hoursAhead) {

		const cacheKey = `${lat},${lon},${hoursAhead}`;
		const cached = this._rawCache.get(cacheKey);

		if (cached) {
			return cached;
		}

		const result = await this.datasource.fetchLocationForecast(lat, lon);
		const timeseries = result.properties.timeseries.slice(0, hoursAhead);

		this._rawCache.set(cacheKey, timeseries);
		return timeseries;
	}

	#groupByDate(forecast) {
		const grouped = {};

		for (const item of forecast) {
			const date = item.date;
			if (!grouped[date]) {
				grouped[date] = [];
			}
			grouped[date].push(item);
		}

		return grouped;
	}


	// @@@ Public metoder som prosesserer og vidre sender bearbeidet data til veiwmodel // @@@
	
	async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
		const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);

		const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

		return timeseries.map((entry) => {
			const date = new Date(entry.time);

			const localTime = date.toLocaleTimeString("no-NO", {
				hour: "2-digit",
				minute: "2-digit",
				timeZone: tz,
			});

			const localDate = date.toLocaleDateString("no-NO", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				timeZone: tz,
			});

			const weatherSymbol =
				entry.data.next_1_hours?.summary ??
				entry.data.next_6_hours?.summary ??
				entry.data.next_12_hours?.summary;

			
			//NB! Dette må vi legge til for å få tall i "dags-tabellen"
			// Vi buurde bruke denne metoden inne i getDailyPeriodForecast??
			const precipitation_amount = 
				entry.data.next_1_hours?.details?.precipitation_amount ?? 
				entry.data.next_6_hours?.details?.precipitation_amount ?? 
				entry.data.next_12_hours?.details?.precipitation_amount
			
			const precipitation_min = 
				entry.data.next_1_hours?.details?.precipitation_min ?? 
				entry.data.next_6_hours?.details?.precipitation_min ?? 
				entry.data.next_12_hours?.details?.precipitation_min

			const precipitation_max = 
				entry.data.next_1_hours?.details?.precipitation_max ?? 
				entry.data.next_6_hours?.details?.precipitation_max ?? 
				entry.data.next_12_hours?.details?.precipitation_max

			return {
				date: localDate,
				localTime,
				precipitation_amount,							//NB! Dette må vi legge til for å få tall i "dags-tabellen"
				precipitation_min,
				precipitation_max,
				details: entry.data.instant.details,
				weatherSymbol: weatherSymbol?.symbol_code,
			};
		});
	}

	async getHourlyForecastGroupedByDate(lat, lon, hoursAhead, timeZone) {
		const forecast = await this.getHourlyForecast(lat, lon, hoursAhead, timeZone);
		return this.#groupByDate(forecast);
	}

	async getDailyPeriodForecast(lat, lon, hoursAhead, timeZone) {
		const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);

		const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

		const TARGET_HOURS = {
			night: 0,
			morning: 6,
			afternoon: 12,
			evening: 18,
		};

		const result = {};

		// Gruppér per dag
		for (const entry of timeseries) {
			const dateObj = new Date(entry.time);

			const localDate = dateObj.toLocaleDateString("no-NO", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				timeZone: tz,
			});

			if (!result[localDate]) {
				result[localDate] = { entries: [] };
			}

			result[localDate].entries.push(entry);
		}

		// Finn perioder
		for (const date in result) {
			const entries = result[date].entries;
			const periods = {};

			for (const [key, targetHour] of Object.entries(TARGET_HOURS)) {
				let bestEntry = null;
				let bestDiff = Infinity;

				for (const entry of entries) {
					const dateObj = new Date(entry.time);

					const hour = Number(
						dateObj.toLocaleTimeString("no-NO", {
							hour: "2-digit",
							timeZone: tz,
						})
					);

					const diff = Math.abs(hour - targetHour);

					if (diff < bestDiff) {
						bestDiff = diff;
						bestEntry = entry;
					}
				}

				const next1 = bestEntry?.data?.next_1_hours;
				const next6 = bestEntry?.data?.next_6_hours;
				const next12 = bestEntry?.data?.next_12_hours;

				const pack = next6 ?? next1 ?? next12;
				const summary = pack?.summary;
				const details = pack?.details;

				if (summary?.symbol_code) {
					periods[key] = {
						weatherSymbol: summary.symbol_code,
						symbolConfidence: summary.symbol_confidence,
						details,
					};
				}
			}

			delete result[date].entries;
			result[date].periods = periods;
		}

		return result;
	}


	async getDailySummary(lat, lon, hoursAhead, timeZone) {
		const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);
		const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

		const TARGET_HOURS = [0, 6, 12, 18];
		const days = {};

		/* -------- 1. Gruppér timeseries per dag -------- */
		for (const entry of timeseries) {
			const dateObj = new Date(entry.time);

			const localDate = dateObj.toLocaleDateString("no-NO", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				timeZone: tz,
			});

			if (!days[localDate]) {
				days[localDate] = [];
			}

			days[localDate].push(entry);
		}

		const result = {};

		/* -------- 2. Velg representativ entry per 6t-blokk -------- */
		for (const date in days) {
			const entries = days[date];
			const blocks = [];

			for (const targetHour of TARGET_HOURS) {
				let bestEntry = null;
				let bestDiff = Infinity;

				for (const entry of entries) {
					const dateObj = new Date(entry.time);
					const hour = Number(
						dateObj.toLocaleTimeString("no-NO", {
							hour: "2-digit",
							hour12: false,
							timeZone: tz,
						})
					);

					const diff = Math.abs(hour - targetHour);

					if (diff < bestDiff) {
						bestDiff = diff;
						bestEntry = entry;
					}
				}

				if (bestEntry) {
					blocks.push(bestEntry);
				}
			}

			/* -------- 3. Beregn dagsoppsummering -------- */
			let minTemp = Infinity;
			let maxTemp = -Infinity;
			let totalPrecip = 0;
			const windSamples = [];

			for (const entry of blocks) {
				const next6 = entry.data.next_6_hours?.details;
				const instant = entry.data.instant?.details;

				// Temperatur
				if (next6?.air_temperature_min !== undefined) {
					minTemp = Math.min(minTemp, next6.air_temperature_min);
				}

				if (next6?.air_temperature_max !== undefined) {
					maxTemp = Math.max(maxTemp, next6.air_temperature_max);
				}

				// Nedbør (ikke-overlappende 6t)
				if (next6?.precipitation_amount !== undefined) {
					totalPrecip += next6.precipitation_amount;
				}

				// Vind (representativ – ikke maks)
				if (instant?.wind_speed !== undefined) {
					windSamples.push(instant.wind_speed);
				}
			}

			result[date] = {
				minTemp: minTemp === Infinity ? null : minTemp,
				maxTemp: maxTemp === -Infinity ? null : maxTemp,
				totalPrecip,
				avgWind:
					windSamples.length > 0
						? windSamples.reduce((a, b) => a + b, 0) /
						windSamples.length
						: null,
			};
		}

		return result;
	}
}


async function main() {

	// Minimal datasource – bruker samme API som resten av prosjektet
	class LocationForecastDataSource {
		async fetchLocationForecast(lat, lon) {
			const res = await fetch(
				`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
				{
					headers: {
						"User-Agent": "location-forecast-test"
					}
				}
			);

			if (!res.ok) {
				throw new Error("Kunne ikke hente forecast");
			}

			return res.json();
		}
	}

	const datasource = new LocationForecastDataSource();
	const repo = new LocationForecastRepository(datasource);

	const lat = 60.10;
	const lon = 9.58;
	const hoursAhead = 72;
	const timeZone = "Europe/Oslo";

	try {
		const dailySummary = await repo.getDailySummary(
			lat,
			lon,
			hoursAhead,
			timeZone
		);

		console.log("Daily summary mottatt!");
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		console.log(JSON.stringify(dailySummary, null, 2));
	}
	catch (error) {
		console.log("Error fetching daily summary:", error.message);
	}
}

main();