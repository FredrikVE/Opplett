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
    /**
     * Fallback-parser for tekstbaserte labels som f.eks: "Mandag 9".
     * Trekker ut det siste tallet som dag, og bruker dagens måned og år.
     */
    parseDayFromText(label) {
        if (!label) {
            return null;
        }

        let lastNumberFound = "";
        let currentNumberAccumulator = "";

        // 1. Skann strengen én gang for å finne det siste tallet
        for (const char of label) {
            const isDigit = char >= "0" && char <= "9";

            if (isDigit) {
                currentNumberAccumulator += char;            // Oppdater "siste tall" fortløpende så lenge vi er inne i en tallrekke
                lastNumberFound = currentNumberAccumulator;
            } 

            else {                                          // Vi traff noe som ikke er et tall (mellomrom, bokstav, etc.)
                currentNumberAccumulator = "";              // Nullstill akkumulatoren for å gjøre klar til neste potensielle tall
            }
        }

        // 2. Hvis vi aldri fant et tall, returner null
        if (!lastNumberFound) {
            return null;
        }

        const day = lastNumberFound.padStart(2, "0");       // 3. Formater dagen (f.eks. "9" -> "09")

        // 4. Hent kontekst for år og måned
        const today = new Date();                           // Vi bruker én Date-instans for å unngå teoretiske tidsavvik (race conditions)
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        // 5. Returner i standard ISO-format
        return `${year}-${month}-${day}`;
    },
        
    /**
     * Formatterer et ISO-tidspunkt til HH:mm i ønsket tidssone.
     * Returnerer null dersom input ikke er en gyldig dato.
     */
    formatTime(isoString, tz) {
        if (!isoString) {
            return null;
        }

        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const formatter = new Intl.DateTimeFormat("nb-NO", {
            timeZone: tz,
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
    }

    async getSunTimes(lat, lon, dateISO, timeZone) {
        const key = `${lat},${lon},${dateISO},${timeZone}`;

        //Sjekk cache
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        //Hent data
        const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
        const { sunrise, sunset } = result?.properties ?? {};

        const output = {
            sunrise: DateUtils.formatTime(sunrise?.time, timeZone),
            sunset: DateUtils.formatTime(sunset?.time, timeZone),
        };

        //Lagre i cache og returner
        this.cache.set(key, output);
        return output;
    }

    async getSunTimesForDateLabels(lat, lon, dateLabels, timeZone) {
        
        //Returnerer et tomt objekt-litteral hvis dateLabels ikke er et array
        if (!Array.isArray(dateLabels)) {
            return {};
        }

        //Definer hvordan vi prosesserer én enkelt label
        const processLabel = async (label) => {
            const fallback = { sunrise: null, sunset: null };
            const dateISO = DateUtils.toISODate(label);

            //Hvis vi ikke får parset datoen, returner fallback med en gang
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
        };

        //Start alle oppgavene i parallell
        const tasks = dateLabels.map((label) => processLabel(label));
        
        //Vent på at alle er ferdige
        const results = await Promise.all(tasks);

        //Konverter array av [key, value] til et objekt { key: value }
        return Object.fromEntries(results);
    }
}