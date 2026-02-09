//src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    constructor(datasource) {
        this.datasource = datasource;
        this.cache = new Map();
    }

    // LOGIKK FOR TID
    // Lokal time (0–23) i gitt tidssone
    #getLocalHour(isoString, timeZone) {
        return Number(
            new Date(isoString).toLocaleTimeString("en-GB", {       //Tidsfomatering til dd/mm/yyyy
                hour: "2-digit",
                hour12: false,
                timeZone
            })
        );
    }

    // Lokal dato-nøkkel: YYYY-MM-DD (stabil sortering)
    #getLocalDateKey(isoString, timeZone) {
        return new Date(isoString).toLocaleDateString("sv-SE", {    //sv-SE gir tidsfomatering på denne måten YYYY-MM-DD. Viktig for å få SunRise til å fungere!
            timeZone
        });
    }

    // Henting av data
    async #getTimeseries(lat, lon, hoursAhead) {
        const key = `${lat},${lon},${hoursAhead}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const res = await this.datasource.fetchLocationForecast(lat, lon);
        const ts = res.properties.timeseries.slice(0, hoursAhead);

        this.cache.set(key, ts);
        return ts;
    }

    // Timevarsel for vær
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const hourly = [];

        for (const entry of timeseries) {
            const timeISO = entry.time;
            const dateISO = this.#getLocalDateKey(timeISO, timeZone);
            const localTime = this.#getLocalHour(timeISO, timeZone);

            const weatherSymbol =
                entry.data.next_1_hours?.summary?.symbol_code ??
                entry.data.next_6_hours?.summary?.symbol_code ??
                null;

            const next1h = entry.data.next_1_hours?.details;
            const next6h = entry.data.next_6_hours?.details;

            let precipitation = {
                amount: 0,
                min: 0,
                max: 0
            };

            if (next1h) {
                precipitation.amount = next1h.precipitation_amount ?? 0;
                precipitation.min = next1h.precipitation_amount_min ?? next1h.precipitation_amount ?? 0;
                precipitation.max = next1h.precipitation_amount_max ?? next1h.precipitation_amount ?? 0;
            } 
            else if (next6h) {
                precipitation.amount = next6h.precipitation_amount ?? 0;
                precipitation.min = next6h.precipitation_amount_min ?? 0;
                precipitation.max = next6h.precipitation_amount_max ?? 0;
            }

            hourly.push({
                timeISO,          // "2026-02-08T12:00:00Z"
                dateISO,          // lokal dato "YYYY-MM-DD"
                localTime,        // 0–23

                // Vær
                weatherSymbol,
                precipitation,

                // Instant
                temp: entry.data.instant.details.air_temperature,
                wind: entry.data.instant.details.wind_speed,
                uv: entry.data.instant.details.ultraviolet_index_clear_sky,
                details: entry.data.instant.details
            });
        }

        return hourly;
    }

    // Dagssammendrag til lukkede DailyForecastCard()
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

                // Oppsummeringsikoner
                symbolNight: this.#getSymbolAtSpecificHour(hours, 3),
                symbolMorning: this.#getSymbolAtSpecificHour(hours, 9),
                symbolAfternoon: this.#getSymbolAtSpecificHour(hours, 15),
                symbolEvening: this.#getSymbolAtSpecificHour(hours, 21)
            };
        }

        return dailySummary;
    }

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    // PRIVATE HJELPEMETODER for beregneing av vær  //
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    #groupHoursByDate(hourlyForecast) {
        const result = {};
        for (const hour of hourlyForecast) {
            if (!result[hour.dateISO]) {
                result[hour.dateISO] = [];
            }
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

    #calculateTotalPrecip(hours) {
        let total = 0;
        let min = 0;
        let max = 0;

        for (const h of hours) {
            total += h.precipitation.amount ?? 0;
            min += h.precipitation.min ?? 0;
            max += h.precipitation.max ?? 0;
        }

        return {
            total: Number(total.toFixed(1)),
            min: Number(min.toFixed(1)),
            max: Number(max.toFixed(1))
        };
    }

    #calculateAvgWind(hours) {
        const daytime = hours
            .filter(h => h.localTime >= 9 && h.localTime <= 18)
            .map(h => h.wind);

        const winds = daytime.length > 0
            ? daytime
            : hours.map(h => h.wind);

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



/*
import LocationForecastDataSource from "../datasource/LocationForecastDataSource.js"
async function main() {

	const repo = new LocationForecastRepository(new LocationForecastDataSource());

	const lat = 68.799759;
	const lon = 16.541850;
	const hoursAhead = 120;
	const timeZone = "Europe/Oslo";

	try {
		const dailySummary = await repo.getDailySummary(lat, lon, hoursAhead, timeZone);

		console.log("Daily summary mottatt!");
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		console.log(JSON.stringify(dailySummary, null, 2));
	}
	catch (error) {
		console.log("Error fetching daily summary:", error.message);
	}
}

main();
*/