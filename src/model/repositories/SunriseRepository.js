//src/model/repositories/SunriseRepository.js
export default class SunriseRepository {
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
    }

    async getSunTimes(lat, lon, dateISO) {
        if (!lat || !lon || !dateISO) {
            return { sunrise: null, sunset: null };
        }

        const key = `${lat},${lon},${dateISO}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
            const { sunrise, sunset } = result?.properties ?? {};

            const output = {
                sunrise: sunrise?.time ?? null,
                sunset: sunset?.time ?? null,
            };

            this.cache.set(key, output);
            return output;
        } 
        
        catch (error) {
            console.error(`Kunne ikke hente soloppgang for ${dateISO}:`, error);
            return { sunrise: null, sunset: null };
        }
    }

    /**
     * Optimalisert for å hente mange datoer parallelt.
     * Dette reduserer ventetiden fra "antall dager x tid" til kun "tiden for ett kall".
     */
    async getSunTimesForDates(lat, lon, isoDates) {
        if (!Array.isArray(isoDates) || isoDates.length === 0) {
            return {};
        }

        //Oppretter alle løftene (promises) samtidig uten å vente på hver enkelt
        const sunPromises = isoDates.map(date => this.getSunTimes(lat, lon, date));

        //Vent på at alle dager blir ferdige parallelt
        const results = await Promise.all(sunPromises);

        //Bygger opp objektet { "2026-02-15": { sunrise, sunset }, ... }
        return isoDates.reduce((acc, date, index) => {
            acc[date] = results[index];
            return acc;
        }, {});
    }

    /**
     * Beregner forskjellen i dagslengde mellom to dager.
     */
    getDayLengthChange(current, previous) {
        if (!current?.sunrise || !current?.sunset || !previous?.sunrise || !previous?.sunset) {
            return { text: null, isLonger: false };
        }

        const currentLen = new Date(current.sunset) - new Date(current.sunrise);
        const prevLen = new Date(previous.sunset) - new Date(previous.sunrise);
        
        // Konverterer millisekunder til minutter
        const diffMinutes = Math.round((currentLen - prevLen) / (1000 * 60));

        const isLonger = diffMinutes > 0;
        const prefix = diffMinutes > 0 ? "+" : "";
        const text = diffMinutes === 0 ? "0 min" : `${prefix}${diffMinutes} min`;

        return {
            text,
            isLonger
        };
    }
}