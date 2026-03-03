import { DateTime } from "luxon";

const UI_LOCALE = "nb-NO";

export function resolveTimezone(explicitTz) {
    return explicitTz || DateTime.local().zoneName;
}

export function formatToLocalTime(isoString, tz) {
    if (!isoString) return "--:--";
    // .setZone(tz) må komme ETTER .fromISO for best resultat med Met.no sine Z-strenger
    return DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE).toFormat("HH:mm");
}

export function getLocalHour(zuluTime, tz) {
    if (!zuluTime) return 0;
    return DateTime.fromISO(zuluTime).setZone(tz).hour;
}

/*
export function formatToLocalDateLabel(isoString, tz) {
    if (!isoString) return "";
    const dt = DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE);
    const label = dt.toFormat("cccc d. MMM");
    return label.charAt(0).toUpperCase() + label.slice(1);
}
*/
// src/ui/utils/TimeZoneUtils/timeFormatters.js

export function formatToLocalDateLabel(dateOrIso, tz) {
    if (!dateOrIso) return "";
    
    // Hvis strengen bare er en dato (10 tegn), parse den i kontekst av tidssonen
    const dt = dateOrIso.length === 10 
        ? DateTime.fromISO(dateOrIso, { zone: tz }) 
        : DateTime.fromISO(dateOrIso).setZone(tz);

    const label = dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM");
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatLocalDate(zuluTime, tz) {
    if (!zuluTime) return "";
    return DateTime.fromISO(zuluTime).setZone(tz).setLocale(UI_LOCALE).toFormat("ccc d. MMM");
}

export function formatLocalDateTime(timestampMs, tz) {
    if (!timestampMs) return "";
    const dt = typeof timestampMs === "number"
        ? DateTime.fromMillis(timestampMs).setZone(tz)
        : DateTime.fromISO(timestampMs).setZone(tz);
    return dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM HH:mm");
}