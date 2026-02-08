//src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    
    constructor(datasource) {
        this.datasource = datasource;
        this.cache = new Map();
    }

    //TID
    #localDate(entry, tz) {
        const date = new Date(entry.time);
        const dateString = date.toLocaleDateString("no-NO", {
            weekday: "long",
            day: "numeric",
            month: "short",
            timeZone: tz
        });
        return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }

    #localHour(entry, tz) {
        return Number(
            new Date(entry.time).toLocaleTimeString("no-NO", {
                hour: "2-digit",
                hour12: false,
                timeZone: tz
            })
        );
    }

    //DATA
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

    //TIMEVARSEL
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const hourly = [];

        for (const entry of timeseries) {
            const dateLabel = this.#localDate(entry, timeZone);
            const startHour = this.#localHour(entry, timeZone);
            
            // NYTT: Hent ut ren ISO-dato (YYYY-MM-DD) fra entry.time
            const dateISO = entry.time.split('T')[0];

            // Finn værsymbol
            const weatherSymbol = entry.data.next_1_hours?.summary?.symbol_code 
                               ?? entry.data.next_6_hours?.summary?.symbol_code;

            // Hent ut nedbørsdetaljer
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
                precipData.isPeriod = false;
                endHour = startHour + 1;
            } 
            else if (next6h !== undefined) {
                precipData.amount = next6h.precipitation_amount ?? 0;
                precipData.min = next6h.precipitation_amount_min ?? (next6h.precipitation_amount ?? 0);
                precipData.max = next6h.precipitation_amount_max ?? (next6h.precipitation_amount ?? 0);
                precipData.isPeriod = true;
                endHour = startHour + 6;
            }

            if (endHour >= 24) endHour -= 24;

            hourly.push({
                dateISO,    // ID for koding
                dateLabel,  // Tekst for UI
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

    //DAGSSAMMENDRAG
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
                symbolNight: this.#getSymbolAtSpecificHour(hoursInDay, 0),
                symbolMorning: this.#getSymbolAtSpecificHour(hoursInDay, 6),
                symbolAfternoon: this.#getSymbolAtSpecificHour(hoursInDay, 12),
                symbolEvening: this.#getSymbolAtSpecificHour(hoursInDay, 18)
            };
        }

        return dailySummary;
    }

    //PRIVATE HJELPEMETODER
    #calculateTotalPrecip(hours) {
        let total = 0;
        let minTotal = 0;
        let maxTotal = 0;
        let coveredUntilHour = -1;

        for (const h of hours) {
            const p = h.precipitation;
            if (h.localTime < coveredUntilHour && p.isPeriod) continue;
            total += p.amount;
            minTotal += p.min;
            maxTotal += p.max;
            if (p.isPeriod) coveredUntilHour = h.localTime + 6;
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

    //Bruker nå dateISO som nøkkel for gruppering
    #groupHoursByDate(hourlyForecast) {
        const result = {};
        for (const hour of hourlyForecast) {
            const key = hour.dateISO;
            if (!result[key]) result[key] = [];
            result[key].push(hour);
        }
        return result;
    }

    #calculateMinMaxTemp(hours) {
        const temperatures = hours.map(h => h.temp);
        return {
            minTemp: Math.round(Math.min(...temperatures)),
            maxTemp: Math.round(Math.max(...temperatures))
        };
    }

    #calculateAvgWind(hours) {
        const daytimeWinds = hours
            .filter(h => h.localTime >= 9 && h.localTime <= 18)
            .map(h => h.wind);

        const winds = daytimeWinds.length > 0 ? daytimeWinds : hours.map(h => h.wind);
        if (winds.length === 0) return 0;

        winds.sort((a, b) => a - b);
        const index = Math.floor(winds.length * 0.75);
        return Math.ceil(winds[index]);
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