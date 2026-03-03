// src/model/domain/GetForecastUseCase.js
export default class GetForecastUseCase {

    // Konstruktør for å ta inn forecastRepository fra App.jsx
    constructor(forecastRepository) {
        this.forecastRepository = forecastRepository;
    }

    async execute({ lat, lon, hoursAhead, timeZone }) {

        if (lat == null || lon == null) {
            throw new Error("Latitude and longitude are required");
        }

        // 1. Henter time-for-time værdata fra repositoriet.
        // Repositoriet har allerede beregnet riktig lokal dato (dateISO) 
        // for hver time basert på timeZone.
        const hourly = await this.forecastRepository.getHourlyForecast(
            lat,
            lon,
            hoursAhead,
            timeZone
        );

        // 2. Grupperer timer per dato
        const unsortedGrouped = {};
        for (const hour of hourly) {
            const dateKey = hour.dateISO;
            if (!unsortedGrouped[dateKey]) {
                unsortedGrouped[dateKey] = { hours: [] };
            }
            unsortedGrouped[dateKey].hours.push(hour);
        }

        // 3. Sorterer gruppene alfabetisk etter dato-nøkkel (ISO-streng)
        // Dette sikrer at Pago Pago (GMT-11) ikke hopper frem i tid pga. 
        // objekt-nøkkel-oppførsel i JS.
        const hourlyByDate = Object.keys(unsortedGrouped)
            .sort()
            .reduce((acc, key) => {
                acc[key] = unsortedGrouped[key];
                return acc;
            }, {});

        // 4. Henter dagsoppsummering (som maks/min temp, total nedbør osv.)
        const dailySummaryByDate = await this.forecastRepository.getDailySummary(
            lat,
            lon,
            hoursAhead,
            timeZone
        );

        return {
            hourlyByDate,
            dailySummaryByDate
        };
    }
}