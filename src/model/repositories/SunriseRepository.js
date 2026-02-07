// src/model/repositories/SunriseRepository.js

/**
 * Konverterer dato-label til ISO-format (YYYY-MM-DD).
 * Håndterer både "11.02.2026" og "Mandag 9" (vasker ut tekst).
 */
function toISODate(dateLabel) {
    if (!dateLabel) return null;

    // Sjekk om vi har det standard formatet "DD.MM.YYYY"
    if (dateLabel.includes(".")) {
        const [dd, mm, yyyy] = dateLabel.split(".");
        if (dd && mm && yyyy) {
            return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }
    }

    // Fallback: Hvis labelen inneholder tekst (f.eks "- feb-Mandag 9"), 
    // trekk ut tallene og anta inneværende måned/år.
    const numbers = dateLabel.match(/\d+/g);
    if (numbers) {
        const day = numbers[numbers.length - 1].padStart(2, "0");
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    return null;
}

/**
 * Formaterer tidsstempel fra API til HH:mm i riktig tidssone
 */
function formatHHmm(isoString, timeZone, locale = "nb-NO") {
    if (!isoString) return null;

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;

    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: timeZone ?? "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return formatter.format(d);
}

export default class SunriseRepository {
    // Konstruktør med instansvariabler
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map(); // Ferdige resultater
        this.inFlight = new Map(); // Pågående fetches (Promise-cache)
    }

    async getSunTimes(lat, lon, dateISO, timeZone) {
        const key = `${lat},${lon},${dateISO},${timeZone ?? "UTC"}`;

        // 1. Ferdig cache
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // 2. Pågående request
        if (this.inFlight.has(key)) {
            return this.inFlight.get(key);
        }

        // 3. Start nytt kall
        const promise = (async () => {
            try {
                const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
                const p = result?.properties ?? {};

                const out = {
                    sunrise: formatHHmm(p.sunrise?.time ?? null, timeZone),
                    sunset: formatHHmm(p.sunset?.time ?? null, timeZone),
                };

                this.cache.set(key, out);
                return out;
            } finally {
                // Viktig: fjern fra inFlight uansett utfall
                this.inFlight.delete(key);
            }
        })();

        this.inFlight.set(key, promise);
        return promise;
    }

    async getSunTimesForDateLabels(lat, lon, dateLabels, timeZone) {
        if (!Array.isArray(dateLabels)) {
            return {};
        }

        // Paralleliser alle datoer
        const tasks = dateLabels.map(async (dateLabel) => {
            const dateISO = toISODate(dateLabel);

            if (!dateISO) {
                return [dateLabel, { sunrise: null, sunset: null }];
            }

            try {
                const sun = await this.getSunTimes(lat, lon, dateISO, timeZone);
                return [dateLabel, sun];
            } catch (error) {
                console.warn("Sunrise-feil for", dateLabel, error);
                return [dateLabel, { sunrise: null, sunset: null }];
            }
        });

        const entries = await Promise.all(tasks);
        return Object.fromEntries(entries);
    }
}