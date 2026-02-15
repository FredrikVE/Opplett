//src/model/repositories/SunriseRepository.js
export default class SunriseRepository {
    constructor(sunriseDataSource) {
        this.datasource = sunriseDataSource;
        this.cache = new Map();
    }

    /**
     * Henter tider for én spesifikk dato.
     * Sjekker cache først for å unngå unødvendige API-kall.
     */
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
     * Dette reduserer ventetiden betraktelig ved å sende alle forespørsler samtidig.
     */
    async getSunTimesForDates(lat, lon, isoDates) {
        if (!Array.isArray(isoDates) || isoDates.length === 0) {
            return {};
        }

        //Oppretter alle promises samtidig
        const sunPromises = isoDates.map(date => this.getSunTimes(lat, lon, date));

        //Venter på at alle blir ferdige parallelt
        const results = await Promise.all(sunPromises);

        //Mapper resultatene tilbake til et objekt med dato som nøkkel
        return isoDates.reduce((acc, date, index) => {
            acc[date] = results[index];
            return acc;
        }, {});
    }

    /**
     * HOVEDMETODE: Produserer en fiks ferdig rapport for ViewModel.
     * Håndterer logikk for "dagen før", parallell henting og formatering.
     */
    async getFullSolarReport(lat, lon, isoDates, tz, formatToLocalTime) {
        if (!isoDates || isoDates.length === 0) return {};

        //Beregn "dagen før" den første datoen i lista (for å finne endring i dagslengde)
        const firstDate = new Date(isoDates[0]);
        const yesterday = new Date(firstDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBeforeISO = yesterday.toISOString().split('T')[0];

        //Hent rådata for alle dager (inkludert dagen før) i én parallell operasjon
        const datesToFetch = [dayBeforeISO, ...isoDates];
        const rawSunDataMap = await this.getSunTimesForDates(lat, lon, datesToFetch);

        //Bygg opp den formaterte rapporten
        const report = {};

        for (let i = 0; i < isoDates.length; i++) {
            const currentDate = isoDates[i];
            
            //For den første dagen sammenligner vi med 'yesterday', 
            //for resten sammenligner vi med forrige dato i arrayen.
            const previousDate = (i === 0) ? dayBeforeISO : isoDates[i - 1];

            const currentTimes = rawSunDataMap[currentDate];
            const previousTimes = rawSunDataMap[previousDate];

            //Beregn endring (lengre/kortere dag)
            const change = this.getDayLengthChange(currentTimes, previousTimes);

            //Lagre ferdig formatert data
            report[currentDate] = {
                sunrise: formatToLocalTime(currentTimes.sunrise, tz),
                sunset: formatToLocalTime(currentTimes.sunset, tz),
                dayLengthDiffText: change.text,
                isGettingLonger: change.isLonger
            };
        }

        return report;
    }

    /**
     * Beregner forskjellen i dagslengde mellom to dager (i minutter).
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