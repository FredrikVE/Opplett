import { DateTime } from "luxon";

export default class LocationForecastRepository {
	constructor(datasource) {
		this.datasource = datasource;
		this.cache = new Map();
	}

	// Henting av data med koordinat-vasking og caching
	async #getTimeseries(lat, lon, hoursAhead) {
		const cleanLat = Math.max(-90, Math.min(90, Number(lat)));
		const cleanLon = ((Number(lon) + 180) % 360 + 360) % 360 - 180;

		const cacheLat = cleanLat.toFixed(2);
		const cacheLon = cleanLon.toFixed(2);
		const key = `${cacheLat},${cacheLon},${hoursAhead}`;
		
		if (this.cache.has(key)) {
			return this.cache.get(key);
		}

		const res = await this.datasource.fetchLocationForecast(cleanLat, cleanLon);
		const ts = res.properties.timeseries.slice(0, hoursAhead + 6);

		this.cache.set(key, ts);
		return ts;
	}

	async getCurrentWeather(lat, lon, timeZone) {
		const hourly = await this.getHourlyForecast(lat, lon, 1, timeZone);
		const now = hourly[0];

		if (!now) return null;

		return {
			weatherSymbol: now.weatherSymbol,
			temp: now.temp,
			feelsLike: now.details.apparent_temperature ?? now.temp,
			precip: now.precipitation.amount,
			wind: now.wind,
			gust: now.details.wind_speed_of_gust ?? now.wind,
			windDir: now.details.wind_from_direction ?? 0,
			uv: now.uv
		};
	}

	async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
		const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
		const now = DateTime.now().setZone(timeZone);

		const startIndex = timeseries.findIndex(entry => {
			const entryTime = DateTime.fromISO(entry.time, { zone: timeZone });
			//return entryTime.plus({ hours: 1 }) > now;
			return entryTime.plus({ minutes: 59 }) > now;
		});

		const effectiveSeries = startIndex > -1 
			? timeseries.slice(startIndex, startIndex + hoursAhead) 
			: timeseries.slice(0, hoursAhead);

		return effectiveSeries.map(entry => {
			const dt = DateTime.fromISO(entry.time, { zone: timeZone });
			
			const next1h = entry.data.next_1_hours?.details;
			const next6h = entry.data.next_6_hours?.details;

			const precipitation1h = next1h ? {
				amount: next1h.precipitation_amount ?? 0,
				min: next1h.precipitation_amount_min ?? next1h.precipitation_amount ?? 0,
				max: next1h.precipitation_amount_max ?? next1h.precipitation_amount ?? 0
			} : null;

			const precipitation6h = next6h ? {
				amount: next6h.precipitation_amount ?? 0,
				min: next6h.precipitation_amount_min ?? 0,
				max: next6h.precipitation_amount_max ?? 0
			} : null;

			return {
				timeISO: entry.time,
				dateISO: dt.toISODate(), // Her genereres dateISO nå
				localTime: dt.hour,
				localMinute: dt.minute,
				utcHour: new Date(entry.time).getUTCHours(),

				weatherSymbol: entry.data.next_1_hours?.summary?.symbol_code ?? 
							   entry.data.next_6_hours?.summary?.symbol_code ?? null,

				precipitation: precipitation1h ?? precipitation6h ?? { amount: 0, min: 0, max: 0 },
				precipitation1h,
				precipitation6h,

				temp: entry.data.instant.details.air_temperature,
				wind: entry.data.instant.details.wind_speed,
				uv: entry.data.instant.details.ultraviolet_index_clear_sky,
				details: entry.data.instant.details
			};
		});
	}

	async getDailySummary(lat, lon, hoursAhead, timeZone) {
		const hourlyForecast = await this.getHourlyForecast(lat, lon, hoursAhead, timeZone);
		const hoursPerDay = this.#groupHoursByDate(hourlyForecast);
		const dailySummary = {};

		for (const dateISO in hoursPerDay) {
			const hours = hoursPerDay[dateISO];
			const temps = this.#calculateMinMaxTemp(hours);
			const precip = this.#calculateTotalPrecip(hours);
			const wind = this.#calculateAvgWind(hours);

			dailySummary[dateISO] = {
				minTemp: temps.minTemp,
				maxTemp: temps.maxTemp,
				totalPrecip: precip.total,
				precipMin: precip.min,
				precipMax: precip.max,
				avgWind: wind,
				symbolNight: this.#getSymbolAtSpecificHour(hours, 3),
				symbolMorning: this.#getSymbolAtSpecificHour(hours, 9),
				symbolAfternoon: this.#getSymbolAtSpecificHour(hours, 15),
				symbolEvening: this.#getSymbolAtSpecificHour(hours, 21)
			};
		}
		return dailySummary;
	}

	#groupHoursByDate(hourlyForecast) {
		const result = {};
		for (const hour of hourlyForecast) {
			if (!result[hour.dateISO]) result[hour.dateISO] = [];
			result[hour.dateISO].push(hour);
		}
		return result;
	}

	#calculateMinMaxTemp(hours) {
		const temps = hours.map(h => h.temp);
		return {
			minTemp: Math.round(Math.min(...temps)),
			maxTemp: Math.round(Math.max(...temps))
		};
	}

	#getBestHourWith6hPrecipAt(hours, targetHour) {
		let best = null;
		let minDiff = Infinity;

		for (const h of hours) {
			if (!h.precipitation6h) continue;
			const diff = Math.abs(h.localTime - targetHour);
			if (diff < minDiff) {
				minDiff = diff;
				best = h;
			}
		}
		return minDiff <= 2 ? best : null;
	}

	#calculateTotalPrecip(hours) {
		const targets = [0, 6, 12, 18];
		let total = 0, min = 0, max = 0;
		const used = new Set();
		const blocks = [];

		for (const t of targets) {
			const best = this.#getBestHourWith6hPrecipAt(hours, t);
			if (best && !used.has(best.timeISO)) {
				used.add(best.timeISO);
				blocks.push(best.precipitation6h);
			}
		}

		if (blocks.length > 0) {
			for (const p of blocks) {
				total += p.amount ?? 0;
				min += p.min ?? 0;
				max += p.max ?? 0;
			}
			return {
				total: Number(total.toFixed(1)),
				min: Number(min.toFixed(1)),
				max: Number(max.toFixed(1))
			};
		}

		for (const h of hours) {
			total += h.precipitation?.amount ?? 0;
			min += h.precipitation?.min ?? 0;
			max += h.precipitation?.max ?? 0;
		}

		return {
			total: Number(total.toFixed(1)),
			min: Number(min.toFixed(1)),
			max: Number(max.toFixed(1))
		};
	}

	#calculateAvgWind(hours) {
		const daytime = hours.filter(h => h.localTime >= 9 && h.localTime <= 18).map(h => h.wind);
		const winds = daytime.length > 0 ? daytime : hours.map(h => h.wind);
		if (winds.length === 0) return 0;
		winds.sort((a, b) => a - b);
		return Math.ceil(winds[Math.floor(winds.length * 0.75)]);
	}

	#getSymbolAtSpecificHour(hours, targetHour) {
		let best = null;
		let minDiff = Infinity;
		for (const h of hours) {
			const diff = Math.abs(h.localTime - targetHour);
			if (diff < minDiff) {
				minDiff = diff;
				best = h;
			}
		}
		return minDiff <= 3 ? best?.weatherSymbol ?? null : null;
	}
}