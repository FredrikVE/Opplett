// src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
	constructor(locationForecastDataSource) {
		this.datasource = locationForecastDataSource;

		// Cache for rå timeseries
		// key: `${lat},${lon},${hoursAhead}`
		this._rawCache = new Map();
	}

	// -------------------------
	// Private helpers
	// -------------------------
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

	// -------------------------
	// Public API
	// -------------------------

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

			return {
				date: localDate,
				localTime,
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
}
