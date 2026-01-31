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

    // =========================
    // Public-metoder
    // =========================

    async getHourlyForecast(lat, lon, hoursAhead, timeZone) {
        const timeseries = await this.#getRawTimeSeries(lat, lon, hoursAhead);

        const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

        return timeseries.map(entry => {

            const date = new Date(entry.time); // UTC fra API

            // Lokal tid (riktig timezone for lokasjonen)
            const localTime = date.toLocaleTimeString("no-NO", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: tz
            });

            // Lokal dato
            const localDate = date.toLocaleDateString("no-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone: tz
            });

            return {
                date: localDate,
                localTime,
                details: entry.data.instant.details,
                weatherSymbol: entry.data.next_1_hours?.summary?.symbol_code
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
            night: 1,
            morning: 7,
            afternoon: 13,
            evening: 18
        };

        const result = {};

        // Gruppér først per dag
        for (const entry of timeseries) {
            const dateObj = new Date(entry.time);

            const localDate = dateObj.toLocaleDateString("no-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone: tz
            });

            if (!result[localDate]) {
                result[localDate] = {
                    date: localDate,
                    entries: []
                };
            }

            result[localDate].entries.push(entry);
        }

        // Finn perioder per dag
        for (const date in result) {
            const entries = result[date].entries;
            const periods = {};

            for (const [key, targetHour] of Object.entries(TARGET_HOURS)) {

                let bestEntry = null;
                let bestDiff = Infinity;

                for (const entry of entries) {
                    const dateObj = new Date(entry.time);

                    const hour = Number(dateObj.toLocaleTimeString("no-NO", {
                            hour: "2-digit",
                            timeZone: tz
                        })
                    );

                    const diff = Math.abs(hour - targetHour);

                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestEntry = entry;
                    }
                }

                const summary = bestEntry?.data?.next_6_hours?.summary;
                const details = bestEntry?.data?.next_6_hours?.details;

                if (summary) {
                    periods[key] = {
                        weatherSymbol: summary.symbol_code,
                        symbolConfidence: summary.symbol_confidence,
                        details
                    };
                }
            }

            delete result[date].entries;
            result[date].periods = periods;
        }

        return result;
    }
}

