// src/model/repositories/LocationForecastRepository.js
import { DateTime } from "luxon";

export default class LocationForecastRepository {
    constructor(datasource) {
        this.datasource = datasource;
        this.cache = new Map();
    }

    //HJELPEMETODER FOR DATAHENTING
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
        const ts = res.properties.timeseries.slice(0, hoursAhead + 6);                   // Henter litt ekstra data (hoursAhead + 6) for å sikre nok data etter startIndex-forskyvning

        this.cache.set(key, ts);
        return ts;
    }

    async getCurrentWeather(lat, lon, timeZone) {
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

    //HOVEDMETODE FOR FORECAST
    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getTimeseries(lat, lon, hoursAhead);
        const now = DateTime.now().setZone(timeZone);

        // FINN RIKTIG STARTPUNKT (startIndex)
        // Vi beholder timen vi er inne i, men hopper frem hvis det er < 15 min til neste time.
        let startIndex = -1;
        for (let i = 0; i < timeseries.length; i++) {
            const entryStart = DateTime.fromISO(timeseries[i].time).setZone(timeZone);
            
            const nextEntry = timeseries[i + 1];
            const entryEnd = nextEntry 
                ? DateTime.fromISO(nextEntry.time).setZone(timeZone)
                : entryStart.plus({ hours: 1 });

            const buffer = entryStart.hour === 23 ? 0 : 15;
            if (now < entryEnd.minus({ minutes: buffer })) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            startIndex = 0;
        }

        // STRUKTURER DATA (Mapping)
        const effectiveSeries = timeseries.slice(startIndex, startIndex + hoursAhead);
        const hourly = [];

        for (const entry of effectiveSeries) {
            const timeISO = entry.time;
            const dt = DateTime.fromISO(timeISO).setZone(timeZone);
            
            // Bruker Luxon direkte for utledede verdier (fjerner behov for Date-hacks)
            const dateISO = dt.toISODate(); 
            const localTime = dt.hour;
            const localMinute = dt.minute;
            const utcHour = new Date(timeISO).getUTCHours();

            const weatherSymbol = 
                entry.data.next_1_hours?.summary?.symbol_code ?? 
                entry.data.next_6_hours?.summary?.symbol_code ?? 
                null;

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

            const precipitation = precipitation1h ?? precipitation6h ?? { amount: 0, min: 0, max: 0 };

            hourly.push({
                timeISO,
                dateISO,
                localTime,
                localMinute,
                utcHour,
                weatherSymbol,
                precipitation, 
                precipitation1h, 
                precipitation6h,
                temp: entry.data.instant.details.air_temperature,
                wind: entry.data.instant.details.wind_speed,
                uv: entry.data.instant.details.ultraviolet_index_clear_sky,
                details: entry.data.instant.details
            });
        }

        return hourly;
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

    //PRIVATE HJELPEMETODER FOR BEREGNING ---
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
        const temps = [];
        for (const h of hours) {
            temps.push(h.temp);
        }
        return {
            minTemp: Math.round(Math.min(...temps)),
            maxTemp: Math.round(Math.max(...temps))
        };
    }

    #getBestHourWith6hPrecipAt(hours, targetHour) {
        let best = null;
        let minDiff = Infinity;
        for (const h of hours) {
            if (!h.precipitation6h) {
                continue;
            }

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
        } 
        
        else {
            for (const h of hours) {
                total += h.precipitation?.amount ?? 0;
                min += h.precipitation?.min ?? 0;
                max += h.precipitation?.max ?? 0;
            }
        }
        return { 
            total: Number(total.toFixed(1)), 
            min: Number(min.toFixed(1)), 
            max: Number(max.toFixed(1)) 
        };
    }

    #calculateAvgWind(hours) {
        const winds = [];
        for (const h of hours) {
            if (h.localTime >= 9 && h.localTime <= 18) {
                winds.push(h.wind);
            }
        }
        if (winds.length === 0) {
            for (const h of hours) winds.push(h.wind);
        }

        if (winds.length === 0) {
            return 0;
        }

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