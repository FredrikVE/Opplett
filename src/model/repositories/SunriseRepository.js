// src/model/repositories/SunriseRepository.js
export default class SunriseRepository {

    // Konstuktør som initialiserer datasource og map for caching
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
    }

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    // Henter soltider for én spesifikk dato.                                         //
    // Returnerer nå rå ISO-strenger istedenfor ferdigformaterte klokkeslett.         //
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    async getSunTimes(lat, lon, dateISO) {
        const key = `${lat},${lon},${dateISO}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
        const { sunrise, sunset } = result?.properties ?? {};

        // fjerner format-hjelperen og returnerer råverdier
        const output = {
            sunrise: sunrise?.time ?? null, // F.eks. "2026-02-08T07:45:00Z"
            sunset: sunset?.time ?? null,   // F.eks. "2026-02-08T16:30:00Z"
        };

        this.cache.set(key, output);
        return output;
    }

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    //  Henter soltider for en liste med ISO-datoer.    //
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ //
    async getSunTimesForDates(lat, lon, isoDates) {

        if (!Array.isArray(isoDates)) {
            return {};                          //returnerer tomt objekt-litteral hvis array med ISO-dates ikke finnes
        }

        const tasks = isoDates.map(async (isoDate) => {
            try {
                const sunTimes = await this.getSunTimes(lat, lon, isoDate);
                return [isoDate, sunTimes];
            } 

            catch (error) {
                console.warn(`Kunne ikke hente soltider for ${isoDate}:`, error.message);
                return [isoDate, { sunrise: null, sunset: null }];
            }
        });

        const results = await Promise.all(tasks);
        return Object.fromEntries(results);
    }
}