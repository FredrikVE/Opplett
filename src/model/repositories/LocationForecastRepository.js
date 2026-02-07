// src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    
    constructor(datasource) {
        this.datasource = datasource;
        this.cache = new Map();
    }

    // ---------- TID ----------
    #localDate(entry, tz) {
        return new Date(entry.time).toLocaleDateString("no-NO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: tz
        });
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

    // ---------- DATA ----------
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

    // ---------- TIMEVARSEL ----------
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const hourly = [];

        for (const entry of timeseries) {

            const date = this.#localDate(entry, timeZone);
            const localTime = this.#localHour(entry, timeZone);

            const weatherSymbol = entry.data.next_1_hours?.summary?.symbol_code ?? entry.data.next_6_hours?.summary?.symbol_code;
            const oneHourPrecip = entry.data.next_1_hours?.details?.precipitation_amount;
            const sixHourPrecip = entry.data.next_6_hours?.details?.precipitation_amount ?? 0;

            const temp = entry.data.instant.details.air_temperature;
            const wind = entry.data.instant.details.wind_speed;

            hourly.push({
                date,
                localTime,
                weatherSymbol,
                oneHourPrecip,
                sixHourPrecip,
                temp,
                wind
            });
        }

        return hourly;
    }

    // ---------- DAGSSAMMENDRAG ----------
    async getDailySummary(lat, lon, hoursAhead, timeZone) {
        const hourlyForecast = await this.getHourlyForecast(lat, lon, hoursAhead, timeZone);
        const hoursPerDay = this.#groupHoursByDate(hourlyForecast);

        const dailySummary = {};

        for (const date in hoursPerDay) {
            const hoursInDay = hoursPerDay[date];

            const { minTemp, maxTemp } = this.#calculateMinMaxTemp(hoursInDay);
            const totalPrecip = this.#calculateTotalPrecip(hoursInDay);
            const avgWind = this.#calculateAvgWind(hoursInDay);

            const symbolNight = this.#getSymbolAtSpecificHour(hoursInDay, 0);
            const symbolMorning = this.#getSymbolAtSpecificHour(hoursInDay, 6);
            const symbolAfternoon = this.#getSymbolAtSpecificHour(hoursInDay, 12);
            const symbolEvening = this.#getSymbolAtSpecificHour(hoursInDay, 18);

            dailySummary[date] = {
                minTemp,
                maxTemp,
                totalPrecip,
                avgWind,
                symbolNight,
                symbolMorning,
                symbolAfternoon,
                symbolEvening
            };
        }

        return dailySummary;
    }

    // ---------- HJELPEMETODE FOR PERIODESYMBOLER ----------
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

        if (!bestEntry || minDiff > 3) return null;

        return bestEntry.weatherSymbol; 
    }

    #groupHoursByDate(hourlyForecast) {
        const result = {};

        for (const hour of hourlyForecast) {
            if (!result[hour.date]) {
                result[hour.date] = [];
            }
            result[hour.date].push(hour);
        }

        return result;
    }

    #calculateMinMaxTemp(hours) {
        const temperatures = [];

        for (const h of hours) {
            temperatures.push(h.temp);
        }

        return {
            minTemp: Math.round(Math.min(...temperatures)),
            maxTemp: Math.round(Math.max(...temperatures))
        };
    }

    #calculateTotalPrecip(hours) {
        let totalPrecip = 0;
        let coveredUntilHour = -1;

        for (const h of hours) {

            // 1. Hopp over timer som allerede er dekket av en 6-timersblokk
            if (h.localTime < coveredUntilHour) {
                continue;
            }

            // 2. Bruk 1-times nedbør hvis tilgjengelig (korttidsvarsel)
            if (h.oneHourPrecip != null) {
                totalPrecip += h.oneHourPrecip;
                continue;
            }

            // 3. Fallback til 6-timers nedbør (langtidsvarsel)
            if (h.sixHourPrecip > 0) {
                totalPrecip += h.sixHourPrecip;
                coveredUntilHour = h.localTime + 6;
            }
        }

        return Number(totalPrecip.toFixed(1));
    }

    #calculateAvgWind(hours) {
        // 1. Samle vind for dagtid (09–18)
        const daytimeWinds = [];

        for (const h of hours) {
            if (h.localTime >= 9 && h.localTime <= 18) {
                daytimeWinds.push(h.wind);
            }
        }

        // 2. Velg hvilke vindverdier som skal brukes
        const winds = [];

        if (daytimeWinds.length > 0) {
            for (const w of daytimeWinds) {
                winds.push(w);
            }
        } 
        
        else {
            for (const h of hours) {
                winds.push(h.wind);
            }
        }

        // 3. Sorter stigende
        winds.sort((a, b) => a - b);

        // 4. 75-percentil (yr.no-aktig presentasjon)
        if (winds.length === 0) {
            return 0;
        }

        const index = Math.floor(winds.length * 0.75);
        return Math.ceil(winds[index]);
    }
}

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