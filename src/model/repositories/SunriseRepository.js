// src/model/repositories/SunriseRepository.js

/**
 * Hjelpefunksjoner flyttet ut for å holde klassen ren.
 */
const DateUtils = {
    /**
     * Konverterer en datolabel til ISO-format (YYYY-MM-DD).
     *
     * Støttede strategier (i denne rekkefølgen):
     * 1. Eksakt format: "DD.MM.YYYY"
     * 2. Fallback: trekk ut siste tall (antas å være dag),
     *    bruk inneværende måned og år
     */
    toISODate(label) {
        if (!label) {
            return null;
        }

        const isoFromDotFormat = this.parseDotSeparatedDate(label);
        if (isoFromDotFormat) {
            return isoFromDotFormat;
        }

        const isoFromTextFallback = this.parseDayFromText(label);
        if (isoFromTextFallback) {
            return isoFromTextFallback;
        }

        return null;
    },

    /**
     * Parser eksakt datoformat "DD.MM.YYYY".
     * Returnerer ISO-dato eller null dersom formatet ikke matcher.
     */
    parseDotSeparatedDate(label) {
        const match = label.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
            return null;
        }

        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
    },

    /**
     * Fallback-parser for tekstbaserte labels som f.eks:
     * "Mandag 9", "fre 12", "– feb Mandag 9"
     *
     * Trekker ut siste tallsekvens og antar dette er dagen i måneden.
     * Bruker inneværende måned og år.
     */
    parseDayFromText(label) {
        const numbersInLabel = label.match(/\d+/g);
        if (!numbersInLabel || numbersInLabel.length === 0) {
            return null;
        }

        const day = numbersInLabel.at(-1).padStart(2, "0");
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        return `${year}-${month}-${day}`;
    },

    /**
     * Formatterer et ISO-tidspunkt til HH:mm i ønsket tidssone.
     * Returnerer null dersom input ikke er en gyldig dato.
     */
    formatTime(isoString, timeZone = "UTC") {
        if (!isoString) {
            return null;
        }

        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const formatter = new Intl.DateTimeFormat("nb-NO", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        return formatter.format(date);
    },
};

export default class SunriseRepository {

    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
        this.inFlight = new Map();
    }

    async getSunTimes(lat, lon, dateISO, timeZone = "UTC") {
        const key = `${lat},${lon},${dateISO},${timeZone}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        if (this.inFlight.has(key)) {
            return this.inFlight.get(key);
        }

        const requestPromise = (async () => {
            try {
                const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
                const properties = result?.properties ?? {};

                const output = {
                    sunrise: DateUtils.formatTime(properties.sunrise?.time, timeZone),
                    sunset: DateUtils.formatTime(properties.sunset?.time, timeZone),
                };

                this.cache.set(key, output);
                return output;
            } 
            
            finally {
                this.inFlight.delete(key);
            }

        })();

        this.inFlight.set(key, requestPromise);
        return requestPromise;
    }

    async getSunTimesForDateLabels(lat, lon, dateLabels, timeZone) {
        
        if (!Array.isArray(dateLabels)) {
            return {};
        }

        const tasks = dateLabels.map(async (label) => {
            const dateISO = DateUtils.toISODate(label);
            const fallback = { sunrise: null, sunset: null };

            if (!dateISO) {
                return [label, fallback];
            }

            try {
                const sunTimes = await this.getSunTimes(lat, lon, dateISO, timeZone);
                return [label, sunTimes];
            } 
            
            catch (error) {
                console.warn(`Feil ved henting av soltider for "${label}":`, error);
                return [label, fallback];
            }
        });

        const entries = await Promise.all(tasks);
        return Object.fromEntries(entries);
    }
}