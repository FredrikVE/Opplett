//src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    
    constructor(datasource) {
        this.datasource = datasource;
        this.cache = new Map();
    }

    // LOGIKK FOR TID
    // En intern hjelper for å regne ut riktig time i tidssonen,
    // slik at gruppering og dags-oppsummering fortsatt fungerer korrekt.
    #getLocalHour(isoString, tz) {
        return Number(
            new Date(isoString).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                hour12: false,
                timeZone: tz
            })
        );
    }

    //Henting av data
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

    //Timevarsel for vær
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const hourly = [];

        for (const entry of timeseries) {
            // Vi sender med rå ISO-streng slik at ViewModel kan formatere den.
            const timeISO = entry.time; 
            const dateISO = entry.time.split('T')[0];
            const startHour = this.#getLocalHour(entry.time, timeZone);

            const weatherSymbol = entry.data.next_1_hours?.summary?.symbol_code 
                               ?? entry.data.next_6_hours?.summary?.symbol_code;

            const next1h = entry.data.next_1_hours?.details;
            const next6h = entry.data.next_6_hours?.details;

            let precipData = { 
                amount: 0, 
                min: 0, 
                max: 0, 
                isPeriod: false
            };

            let endHour = startHour + 1;
            if (next1h !== undefined) {
                precipData.amount = next1h.precipitation_amount;
                precipData.min = next1h.precipitation_amount_min ?? next1h.precipitation_amount;
                precipData.max = next1h.precipitation_amount_max ?? next1h.precipitation_amount;
                endHour = startHour + 1;
            } 

            else if (next6h !== undefined) {
                precipData.amount = next6h.precipitation_amount ?? 0;
                precipData.min = next6h.precipitation_amount_min ?? 0;
                precipData.max = next6h.precipitation_amount_max ?? 0;
                precipData.isPeriod = true;
                endHour = startHour + 6;
            }

            if (endHour >= 24) endHour -= 24;

            hourly.push({
                timeISO,    // SSOT: Fullstendig tidspunkt "2026-02-08T12:00:00Z"
                dateISO,    // "2026-02-08" (nøkkel for gruppering)
                localTime: startHour,
                endTime: endHour,
                weatherSymbol,
                precipitation: precipData,
                temp: entry.data.instant.details.air_temperature,
                wind: entry.data.instant.details.wind_speed,
                uv: entry.data.instant.details.ultraviolet_index_clear_sky,
                details: entry.data.instant.details
            });
        }
        return hourly;
    }

    //Dagssammendrag til lukkede DailyForecastCard()
    async getDailySummary(lat, lon, hoursAhead, timeZone) {
        const hourlyForecast = await this.getHourlyForecast(lat, lon, hoursAhead, timeZone);
        const hoursPerDay = this.#groupHoursByDate(hourlyForecast);

        const dailySummary = {};

        for (const dateISO in hoursPerDay) {
            const hoursInDay = hoursPerDay[dateISO];
            const temperatures = this.#calculateMinMaxTemp(hoursInDay);
            const precip = this.#calculateTotalPrecip(hoursInDay);
            const wind = this.#calculateAvgWind(hoursInDay);

            dailySummary[dateISO] = {
                minTemp: temperatures.minTemp,
                maxTemp: temperatures.maxTemp,
                totalPrecip: precip.total,
                precipMin: precip.min,
                precipMax: precip.max,
                avgWind: wind,
                // Hent de værsymboler for kl 03, 09, 15 og 21.
                symbolNight: this.#getSymbolAtSpecificHour(hoursInDay, 3),
                symbolMorning: this.#getSymbolAtSpecificHour(hoursInDay, 9),
                symbolAfternoon: this.#getSymbolAtSpecificHour(hoursInDay, 15),
                symbolEvening: this.#getSymbolAtSpecificHour(hoursInDay, 21)
            };
        }
        return dailySummary;
    }

    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  //
    //PRIVATE HJELPEMETODER for beregneing av vær  //
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    #calculateTotalPrecip(hours) {
        let total = 0;
        let minTotal = 0;
        let maxTotal = 0;
        let coveredUntilHour = -1;

        for (const h of hours) {
            if (h.localTime < coveredUntilHour && h.precipitation.isPeriod) {
                continue;
            }

            total += h.precipitation.amount;
            minTotal += h.precipitation.min;
            maxTotal += h.precipitation.max;

            if (h.precipitation.isPeriod) {
                coveredUntilHour = h.localTime + 6;
            }
        }

        return { 
            total: Number(total.toFixed(1)), 
            min: Number(minTotal.toFixed(1)), 
            max: Number(maxTotal.toFixed(1)) 
        };
    }

    #getSymbolAtSpecificHour(hours, targetHour) {
        let bestEntry = null;
        let minDiff = Infinity;

        for (const h of hours) {
            const diff = Math.abs(h.localTime - targetHour);
            if (diff < minDiff) {
                minDiff = diff;
                bestEntry = h;
            }
        }
        return (bestEntry && minDiff <= 3) ? bestEntry.weatherSymbol : null;
    }

    #groupHoursByDate(hourlyForecast) {
        const result = {};
        for (const hour of hourlyForecast) {
            const key = hour.dateISO;
            if (!result[key]) {
                result[key] = [];
            }

            result[key].push(hour);
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

    #calculateAvgWind(hours) {
        const daytimeWinds = hours.filter(h => 
            h.localTime >= 9 && h.localTime <= 18).map(h => 
                h.wind
            );

        const winds = daytimeWinds.length > 0 ? daytimeWinds : hours.map(h => h.wind);
        if (winds.length === 0) {
            return 0;
        }

        winds.sort((a, b) => a - b);

        return Math.ceil(winds[Math.floor(winds.length * 0.75)]);
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