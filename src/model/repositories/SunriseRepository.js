// src/model/repositories/SunriseRepository.js

// "11.02.2026" -> "2026-02-11"
function toISODate(dateLabel) {
    if (!dateLabel) {
		return null;
	}

    const [dd, mm, yyyy] = dateLabel.split(".");
    if (!dd || !mm || !yyyy) {
		return null;
	}

    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function formatHHmm(isoString, timeZone, locale = "nb-NO") {
    if (!isoString) {
		return null;
	}

    const d = new Date(isoString);

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

        //Ferdig cache
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        //Pågående request
        if (this.inFlight.has(key)) {
            return this.inFlight.get(key);
        }

        //Start nytt kall
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
            } 
			finally {
                // Viktig: fjern fra inFlight uansett
                this.inFlight.delete(key);
            }
        })
		();

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
                return [
                    dateLabel,
                    { sunrise: null, sunset: null },
                ];
            }

            try {
                const sun = await this.getSunTimes(lat, lon, dateISO, timeZone);
                return [dateLabel, sun];
            } 
			catch (error) {
                console.warn("Sunrise-feil for", dateLabel, error);
                
				return [ dateLabel, { sunrise: null, sunset: null } ];
            }
        });

        const entries = await Promise.all(tasks);
        return Object.fromEntries(entries);
    }
}
