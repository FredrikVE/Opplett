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

    async getCurrentWeather(lat, lon, timeZone) {
        //Henter kun den aller første timen
        const hourly = await this.getHourlyForecast(lat, lon, 1, timeZone);
        const now = hourly[0];

        if (!now) {
            return null;
        }

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

    // Timevarsel for vær
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const hourly = [];

        for (const entry of timeseries) {
            const timeISO = entry.time;
            const dateISO = this.#getLocalDateKey(timeISO, timeZone);
            const localTime = this.#getLocalHour(timeISO, timeZone);
            const utcHour = new Date(timeISO).getUTCHours();

            const weatherSymbol =
                entry.data.next_1_hours?.summary?.symbol_code ??
                entry.data.next_6_hours?.summary?.symbol_code ??
                null;

            const next1h = entry.data.next_1_hours?.details;
            const next6h = entry.data.next_6_hours?.details;

            const precipitation1h = next1h
                ? {
                    amount: next1h.precipitation_amount ?? 0,
                    min: next1h.precipitation_amount_min ?? next1h.precipitation_amount ?? 0,
                    max: next1h.precipitation_amount_max ?? next1h.precipitation_amount ?? 0
                }
                : null;

            const precipitation6h = next6h
                ? {
                    amount: next6h.precipitation_amount ?? 0,
                    min: next6h.precipitation_amount_min ?? 0,
                    max: next6h.precipitation_amount_max ?? 0
                }
                : null;

            // Dette brukes til timevis visning (som før)
            const precipitation = precipitation1h ?? precipitation6h ?? { amount: 0, min: 0, max: 0 };

            hourly.push({
                timeISO,          // "2026-02-08T12:00:00Z"
                dateISO,          // lokal dato "YYYY-MM-DD"
                localTime,        // 0–23
                utcHour,          // 0–23 (UTC)

                // Vær
                weatherSymbol,

                // Nedbør
                precipitation,    // "beste" for timekort
                precipitation1h,  // rå 1t
                precipitation6h,  // rå 6t

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

        return minDiff <= 2 ? best : null;  // 2t slingringsmonn er trygt for timeserie
    }

    #calculateTotalPrecip(hours) {
        // VærVarslet-lignende: 4 x 6t-perioder per LOKAL dag (00/06/12/18)
        const targets = [0, 6, 12, 18];

        let total = 0;
        let min = 0;
        let max = 0;

        const used = new Set();
        const blocks = [];

        for (const t of targets) {
            const best = this.#getBestHourWith6hPrecipAt(hours, t);

            if (!best) {
                continue;
            }

            // Unngå duplikat hvis oppløsningen blir grovere senere i serien
            if (used.has(best.timeISO)) {
                continue;
            }

            used.add(best.timeISO);

            blocks.push(best.precipitation6h);
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

        // Fallback: hvis vi mangler 6t-data, bruk det du allerede hadde (1t/6t "beste")
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
    
    //const hoursAhead = 120;
    const hoursAhead = 36;

    //Harstad, Troms
	//const lat = 68.799759;
	//const lon = 16.541850;
	//const timeZone = "Europe/Oslo";

    //Sydney Australia
    const lat = -33.936559;
    const lon = 151.255239
    const timeZone = "Australia/Sydney";


	try {
		const dailySummary = await repo.getDailySummary(lat, lon, hoursAhead, timeZone);

		console.log("Daily summary mottatt!");
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        console.log(`HouersAhed: ${hoursAhead}`)
		console.log(JSON.stringify(dailySummary, null, 2));
	}
	catch (error) {
		console.log("Error fetching daily summary:", error.message);
	}
}

main();
*/
