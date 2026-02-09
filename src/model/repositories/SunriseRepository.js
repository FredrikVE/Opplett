//src/model/repositories/SunriseRepository.js
export default class SunriseRepository {
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
    }

    async getSunTimes(lat, lon, dateISO) {
        const key = `${lat},${lon},${dateISO}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
        const { sunrise, sunset } = result?.properties ?? {};

        const output = {
            sunrise: sunrise?.time ?? null,
            sunset: sunset?.time ?? null,
        };

        this.cache.set(key, output);
        return output;
    }

    async getSunTimesForDates(lat, lon, isoDates) {
        if (!Array.isArray(isoDates)) return {};

        const tasks = isoDates.map(async (isoDate) => {
            const sunTimes = await this.getSunTimes(lat, lon, isoDate);
            return [isoDate, sunTimes];
        });

        const results = await Promise.all(tasks);
        return Object.fromEntries(results);
    }

    getDayLengthChange(current, previous) {
        if (!current?.sunrise || !current?.sunset || !previous?.sunrise || !previous?.sunset) {
            return { 
                text: null, isLonger: false 
            };
        }

        const currentLen = new Date(current.sunset) - new Date(current.sunrise);
        const prevLen = new Date(previous.sunset) - new Date(previous.sunrise);
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