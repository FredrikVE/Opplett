// src/model/repositories/SunriseRepository.js
export default class SunriseRepository {
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
    }

    /**
     * Henter soltider for én spesifikk dato.
     * @param {number} lat - Breddegrad
     * @param {number} lon - Lengdegrad
     * @param {string} dateISO - Dato i formatet YYYY-MM-DD
     * @param {string} timeZone - Tidssone (f.eks. "Europe/Oslo")
     */
    async getSunTimes(lat, lon, dateISO, timeZone) {
        // Vi inkluderer ikke tz i cachenøkkelen da koordinater + dato er unikt nok,
        // men beholder det for formatering.
        const key = `${lat},${lon},${dateISO}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
        const { sunrise, sunset } = result?.properties ?? {};

        // Intern hjelper for å formatere tidspunktet lokalt
        const format = (isoString) => {
            if (!isoString) {
                return null;
            }

            const date = new Date(isoString);

            if (isNaN(date.getTime())) {
                return null;
            }

            return new Intl.DateTimeFormat("nb-NO", {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(date);
        };

        const output = {
            sunrise: format(sunrise?.time),
            sunset: format(sunset?.time),
        };

        this.cache.set(key, output);
        return output;
    }

    /**
     * Henter soltider for en liste med ISO-datoer.
     * Returnerer et objekt der hver ISO-dato er en nøkkel.
     */
    async getSunTimesForDates(lat, lon, isoDates, timeZone) {
        if (!Array.isArray(isoDates)) {
            return {};
        }

        const tasks = isoDates.map(async (isoDate) => {
            try {
                // Returnerer paret [dato, soltider] for Object.fromEntries
                const sunTimes = await this.getSunTimes(lat, lon, isoDate, timeZone);
                return [isoDate, sunTimes];
            } 
            
            catch (error) {
                console.warn(`Kunne ikke hente soltider for ${isoDate}:`, error.message);
                return [isoDate, { sunrise: null, sunset: null }];
            }
        });

        const results = await Promise.all(tasks);
        
        // Returnerer et objekt som ser slik ut: { "2026-02-08": { sunrise: "08:00", ... } }
        return Object.fromEntries(results);
    }
}