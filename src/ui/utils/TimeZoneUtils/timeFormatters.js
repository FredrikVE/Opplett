// src/ui/utils/TimeZoneUtils/timeFormatters.js
import { DateTime } from "luxon";

const UI_LOCALE = "nb-NO";

export function resolveTimezone(explicitTz) {
    return explicitTz || DateTime.local().zoneName;
}

/**
 * HH:mm i lokal tid. 
 */
export function formatToLocalTime(isoString, tz) {
    if (!isoString) return "--:--";

    const dt = DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE);
    
    // DEBUG: Fjern denne når alt stemmer
    if (tz.includes("Chatham") || tz.includes("Kathmandu")) {
        console.log(`[TZ DEBUG] ${tz}: ISO ${isoString} -> Lokal ${dt.toFormat("HH:mm")} (Offset: ${dt.offset})`);
    }

    return dt.toFormat("HH:mm");
}

/**
 * Time (0–23) i lokal tid.
 */
export function getLocalHour(zuluTime, tz) {
    if (!zuluTime) return 0;
    return DateTime.fromISO(zuluTime).setZone(tz).hour;
}

/**
 * Dagsetikett: "Mandag 12. feb"
 */
export function formatToLocalDateLabel(isoString, tz) {
    if (!isoString) return "";
    const dt = DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE);
    const label = dt.toFormat("cccc d. MMM");
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Kort dato: "man. 12. feb"
 */
export function formatLocalDate(zuluTime, tz) {
    if (!zuluTime) return "";
    return DateTime.fromISO(zuluTime).setZone(tz).setLocale(UI_LOCALE).toFormat("ccc d. MMM");
}

/**
 * Full dato og klokkeslett
 */
export function formatLocalDateTime(timestampMs, tz) {
    if (!timestampMs) return "";

    let dt;
    if (typeof timestampMs === "number") {
        dt = DateTime.fromMillis(timestampMs).setZone(tz);
    } else {
        dt = DateTime.fromISO(timestampMs).setZone(tz);
    }

    return dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM HH:mm");
}