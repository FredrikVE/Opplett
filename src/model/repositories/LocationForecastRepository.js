// src/model/repositories/LocationForecastRepository.js
export default class LocationForecastRepository {
    
    // Konstruktør som tar inn tilhørende datasource
    constructor(locationForecastDataSource) {
        this.datasource = locationForecastDataSource;
    }

    // Private hjelpemetoder
    async #getRawTimeSeries(lat, lon, hoursAhead) {

        // Krever at antall timer frem er definert. Derfor legger vi inn sjekker for dette.
        if (hoursAhead === undefined || hoursAhead === null) {
            throw new Error("hoursAhead must be specified");
        }
        
        if (!Number.isInteger(hoursAhead) || hoursAhead <= 0) {
            throw new Error("hoursAhead must be a positive integer");
        }

        const result = await this.datasource.fetchLocationForecast(lat, lon);
        const timeseries = result.properties.timeseries;
        
        return timeseries.slice(0, hoursAhead);
    }

    #getHour(item) {
        const localTime = item.localTime;      // f.eks. "08:00"
        const hourPart = localTime.split(":")[0]; // "08"
        const hour = Number(hourPart);          // 8

        return hour;
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

    // Public-metoder som skal brukes i viewmodel
    async getHourlyForecast(lat, lon, hoursAhead) {
        const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);

        return timeseries.map(entry => {

            // Konverterer tid til lokal tid for å returnere sammen med værmeldingen
            const date = new Date(entry.time); // UTC lokal dato

            // Lokal tid på format eks "12:00" (når det står 11 i apiet, er det kl 12 i norge)
            const localTime = date.toLocaleTimeString("no-NO", {
                hour: "2-digit",
                minute: "2-digit"
            });

            // Konvererer til dato på formatet "22.01.2026"
            const localDate = date.toLocaleDateString("no-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });

            return {
                date: localDate,        // sender med dato på formatet "22.01.2026"
                localTime: localTime,        // sender med tidspunkt på formetet "12:00"
                details: entry.data.instant.details,
                weatherSymbol: entry.data.next_1_hours?.summary?.symbol_code
            };
        });
    }
    

    async getHourlyForecastGroupedByDate(lat, lon, hoursAhead) {
        const forecast = await this.getHourlyForecast(lat, lon, hoursAhead);
        return this.#groupByDate(forecast);
    }


    async getDailyPeriodForecast(lat, lon, hoursAhead) {
        const hourlyForecast = await this.getHourlyForecast(lat, lon, hoursAhead);
        const groupedByDate = this.#groupByDate(hourlyForecast);

        const result = {};

        for (const date in groupedByDate) {
            const entries = groupedByDate[date];

            const periods = {};

            const night = entries.find(i => this.#getHour(i) === 2);
            if (night) {
                periods.night = {
                    localTime: night.localTime,
                    weatherSymbol: night.weatherSymbol,
                    details: night.details
                };
            }

            const morning = entries.find(i => this.#getHour(i) === 8);
            if (morning) {
                periods.morning = {
                    localTime: morning.localTime,
                    weatherSymbol: morning.weatherSymbol,
                    details: morning.details
                };
            }

            const afternoon = entries.find(i => this.#getHour(i) === 14);
            if (afternoon) {
                periods.afternoon = {
                    localTime: afternoon.localTime,
                    weatherSymbol: afternoon.weatherSymbol,
                    details: afternoon.details
                };
            }

            const evening = entries.find(i => this.#getHour(i) === 19);
            if (evening) {
                periods.evening = {
                    localTime: evening.localTime,
                    weatherSymbol: evening.weatherSymbol,
                    details: evening.details
                };
            }

            result[date] = {
                date,
                periods,
                hourly: entries
            };
        }

        return result;
    }
}

/*
import LocationForecastDataSource from "../datasource/LocationForecastDataSource.js";

async function main() {
    const datasource = new LocationForecastDataSource();
    const repository = new LocationForecastRepository(datasource);

    // Lambertseter
    //const lat = 59.86;
    //const lon = 10.82;

    // Valle mariana
    const lat = 27.777835;
    const lon = -15.692579;

    const hoursAhead = 12;

    try {
        const forecast = await repository.getHourlyForecast(lat, lon, hoursAhead);

        console.log(`@@@@@@@@@@ Hourly forecast ${forecast[0].date} @@@@@@@@@@`);
        forecast.forEach(({localTime, details, weatherSymbol }) => {
       
            console.log(localTime); // "klokka er egentlig 12:00 når det står 11 i apiet"

            console.log(`\t- Temp: ${details.air_temperature}°C`);
            console.log(`\t- Wind: ${details.wind_speed} m/s`);
            console.log(`\t- Wind gust: ${details.wind_speed_of_gust} m/s`);
            console.log(`\t- Precipitation amount: ${details.precipitation_amount}`)
            console.log(`\t- UV index: ${details.ultraviolet_index_clear_sky}`)
            console.log(` \t- Symbol: ${weatherSymbol}`);
            console.log()
        });
        

    } 
    
    catch (error) {
        console.error("Error:", error.message);
    }
}

main();
*/