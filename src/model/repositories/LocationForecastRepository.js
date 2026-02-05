// src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    constructor(locationForecastDataSource) {
        this.datasource = locationForecastDataSource;
        this._rawCache = new Map();
    }

    // @@@ Private hjelpemetoder @@@ //

    async #getRawTimeSeries(lat, lon, hoursAhead) {
        const cacheKey = `${lat},${lon},${hoursAhead}`;
        if (this._rawCache.has(cacheKey)) return this._rawCache.get(cacheKey);

        const result = await this.datasource.fetchLocationForecast(lat, lon);
        const timeseries = result.properties.timeseries.slice(0, hoursAhead);

        this._rawCache.set(cacheKey, timeseries);
        return timeseries;
    }

    #groupEntriesByDate(timeseries, tz) {
        return timeseries.reduce((acc, entry) => {
            const localDate = new Date(entry.time).toLocaleDateString("no-NO", {
                year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz
            });
            if (!acc[localDate]) acc[localDate] = [];
            acc[localDate].push(entry);
            return acc;
        }, {});
    }

    #findBestEntryForHour(entries, targetHour, tz) {
        let bestEntry = null;
        let minDiff = Infinity;

        for (const entry of entries) {
            const dateObj = new Date(entry.time);
            const currentLocalHour = Number(dateObj.toLocaleTimeString("no-NO", {
                hour: "2-digit", hour12: false, timeZone: tz
            }));
            
            const diff = Math.abs(currentLocalHour - targetHour);
            if (diff < minDiff) {
                minDiff = diff;
                bestEntry = entry;
            }
        }
        return bestEntry;
    }

    // @@@ Public API @@@ //
    
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);
        const tz = timeZone ?? "Europe/Oslo";

        return timeseries.map((entry) => {
            const date = new Date(entry.time);
            const data = entry.data;
            const next1 = data.next_1_hours;
            const next6 = data.next_6_hours;
            const next12 = data.next_12_hours;

            return {
                date: date.toLocaleDateString("no-NO", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz }),
                localTime: date.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", timeZone: tz }),
                // Gjeninnfører logikken for å sjekke 1t, så 6t, så 12t
                precipitation_amount: next1?.details?.precipitation_amount ?? next6?.details?.precipitation_amount ?? next12?.details?.precipitation_amount ?? 0,
                precipitation_min: next1?.details?.precipitation_min ?? next6?.details?.precipitation_min ?? next12?.details?.precipitation_min,
                precipitation_max: next1?.details?.precipitation_max ?? next6?.details?.precipitation_max ?? next12?.details?.precipitation_max,
                details: data.instant.details,
                weatherSymbol: (next1 ?? next6 ?? next12)?.summary?.symbol_code,
            };
        });
    }

    async getHourlyForecastGroupedByDate(lat, lon, hoursAhead, timeZone) {
        const forecast = await this.getHourlyForecast(lat, lon, hoursAhead, timeZone);
        return forecast.reduce((acc, item) => {
            if (!acc[item.date]) acc[item.date] = [];
            acc[item.date].push(item);
            return acc;
        }, {});
    }

    async getDailyPeriodForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);
        const tz = timeZone ?? "Europe/Oslo";
        
		const TARGET_HOURS = { 
			night: 0, 
			morning: 6, 
			afternoon: 12, 
			evening: 18 
		};

        const groupedDays = this.#groupEntriesByDate(timeseries, tz);

		
        return Object.fromEntries(
            Object.entries(groupedDays).map(([date, entries]) => {
                const periods = {};
                for (const [label, hour] of Object.entries(TARGET_HOURS)) {
                    const entry = this.#findBestEntryForHour(entries, hour, tz);
                    if (!entry) continue;

                    // Prioriterer 6t for perioder (morgen/dag/osv) slik som originalen
                    const pack = entry.data.next_6_hours ?? entry.data.next_1_hours ?? entry.data.next_12_hours;
                    if (pack?.summary?.symbol_code) {
                        periods[label] = {
                            weatherSymbol: pack.summary.symbol_code,
                            details: pack.details,
                        };
                    }
                }
                return [date, { periods }];
            })
        );
    }

    async getDailySummary(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);
        const tz = timeZone ?? "Europe/Oslo";
        const groupedDays = this.#groupEntriesByDate(timeseries, tz);
        const TARGET_HOURS = [0, 6, 12, 18];

        return Object.fromEntries(
            Object.entries(groupedDays).map(([date, entries]) => {
                // Vi henter representativ data for hver 6. time (0, 6, 12, 18)
                const blocks = TARGET_HOURS.map(h => this.#findBestEntryForHour(entries, h, tz)).filter(Boolean);

                let minTemp = Infinity;
                let maxTemp = -Infinity;
                let totalPrecip = 0;
                const windSamples = [];

                blocks.forEach(entry => {
                    const next6 = entry.data.next_6_hours?.details;
                    const instant = entry.data.instant?.details;

                    // Bruker METs egne min/max verdier hvis de finnes (mer nøyaktig)
                    if (next6?.air_temperature_min !== undefined) minTemp = Math.min(minTemp, next6.air_temperature_min);
                    if (next6?.air_temperature_max !== undefined) maxTemp = Math.max(maxTemp, next6.air_temperature_max);
                    
                    // Fallback til instant hvis 6t-vindu mangler
                    if (next6?.air_temperature_min === undefined && instant?.air_temperature) {
                        minTemp = Math.min(minTemp, instant.air_temperature);
                        maxTemp = Math.max(maxTemp, instant.air_temperature);
                    }

                    if (next6?.precipitation_amount !== undefined) totalPrecip += next6.precipitation_amount;
                    if (instant?.wind_speed !== undefined) windSamples.push(instant.wind_speed);
                });

                return [date, {
                    minTemp: minTemp === Infinity ? null : minTemp,
                    maxTemp: maxTemp === -Infinity ? null : maxTemp,
                    totalPrecip: Number(totalPrecip.toFixed(1)),
                    avgWind: windSamples.length > 0 ? (windSamples.reduce((a, b) => a + b, 0) / windSamples.length) : null
                }];
            })
        );
    }
}

import LocationForecastDataSource from "../datasource/LocationForecastDataSource.js"
async function main() {



	const repo = new LocationForecastRepository(new LocationForecastDataSource());

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