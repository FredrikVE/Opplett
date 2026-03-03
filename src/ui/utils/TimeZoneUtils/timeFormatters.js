import { DateTime } from "luxon";
import tzLookup from "tz-lookup";

const UI_LOCALE = "nb-NO";

//SSOT RESOLVER
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

//FORMATTERE
export function formatToLocalTime(isoString, tz) {
    if (!isoString) return "--:--";
    return DateTime.fromISO(isoString).setZone(tz).setLocale(UI_LOCALE).toFormat("HH:mm");
}

export function getLocalHour(zuluTime, tz) {
    if (!zuluTime) return 0;
    return DateTime.fromISO(zuluTime).setZone(tz).hour;
}

export function formatToLocalDateLabel(dateOrIso, tz) {
    if (!dateOrIso) return "";
    const dt = dateOrIso.length === 10 
        ? DateTime.fromISO(dateOrIso, { zone: tz }) 
        : DateTime.fromISO(dateOrIso).setZone(tz);

    const label = dt.setLocale(UI_LOCALE).toFormat("cccc d. MMM");
    return label.charAt(0).toUpperCase() + label.slice(1);
}

// DENNE MANGLER SIKKERT EXPORT HOS DEG:
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