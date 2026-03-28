import { DateTime } from "luxon";
import tzLookup from "tz-lookup";

const UI_LOCALE = "nb-NO";

/**
 * SSOT RESOLVER: Sikrer at vi alltid har en gyldig tidssone.
 * Bruker koordinater for å slå opp tidssone, med spesialhåndtering for 
 * utfordrende områder som Amerikansk Samoa.
 */
export function resolveTimezone(lat, lon, explicitTz, locationName) {
    if (explicitTz) return explicitTz;
    if (lat === null || lon === null) return DateTime.local().zoneName;

    let tz = tzLookup(lat, lon);
    const nameLower = (locationName || "").toLowerCase();
    const isSamoa = nameLower.includes("samoa");
    const isAmerican = nameLower.includes("amerikansk") || nameLower.includes("american");

    if (isSamoa && isAmerican && tz === "Pacific/Apia") {
        return "Pacific/Pago_Pago";
    }
    return tz;
}

/**
 * Formaterer ISO-streng til HH:mm (f.eks. 14:00).
 * Brukes primært til tabellvisning og sol-tider.
 */
export function formatToLocalTime(isoString, tz) {
    if (!isoString) return "--:--";
    return DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE).toFormat("HH:mm");
}

/**
 * Henter timetallet (0-23) fra et tidspunkt.
 * Highcharts akser sender tid som 'number' (ms), mens API-data er 'string' (ISO).
 * Vi sjekker typen for å velge riktig Luxon-metode (fromMillis vs fromISO).
 */
export function getLocalHour(zuluTime, tz) {
    if (!zuluTime) return 0;

    const dt = typeof zuluTime === "number" 
        ? DateTime.fromMillis(zuluTime).setZone(tz) 
        : DateTime.fromISO(zuluTime).setZone(tz);
    
    return dt.hour;
}

/**
 * Formaterer dato for x-aksen (f.eks. "tir. 3. mar").
 * Støtter nå både millisekunder fra Highcharts-ticks og ISO-strenger.
 * Dette fjerner "NaN" og "Invalid DateTime" feil i grafen.
 */
export function formatLocalDate(zuluTime, tz) {
    if (!zuluTime) return "";

    const dt = typeof zuluTime === "number"             //Hvis datatypen er number
        ? DateTime.fromMillis(zuluTime).setZone(tz)     //Dersom det er number, bruk Millis-metoden. 
        : DateTime.fromISO(zuluTime).setZone(tz);       //Hvis ikke (altså tekst), bruk ISO-metoden.
        
    return dt.setLocale(UI_LOCALE).toFormat("ccc d. MMM");
}

/**
 * Lager en mer detaljert datolabel (f.eks. "Tirsdag 3. mars").
 * Brukes ofte som overskrifter i værmeldingen.
 */
export function formatToLocalDateLabel(dateOrIso, tz) {
    if (!dateOrIso) return "";
    
    // Håndterer både rene dato-strenger (YYYY-MM-DD) og fulle tidsstempler
    const dt = dateOrIso.length === 10 
        ? DateTime.fromISO(dateOrIso, { zone: tz }) 
        : DateTime.fromISO(dateOrIso).setZone(tz);

    const label = dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM");
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Fullstendig formatering for tooltips (f.eks. "tirsdag 3. mars 15:00").
 * Er robust mot både tall (ms) og strenger (ISO).
 */
export function formatLocalDateTime(timestampMs, tz) {
    if (!timestampMs) return "";
    
    const dt = typeof timestampMs === "number"
        ? DateTime.fromMillis(timestampMs).setZone(tz)
        : DateTime.fromISO(timestampMs).setZone(tz);
        
    return dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM HH:mm");
}