//src/ui/utils/TimeZoneUtils/timeFormatters.js
const UI_LOCALE = "nb-NO";

//Finn aktiv tidssone med fallback
export function resolveTimezone(explicitTz) {
    if (explicitTz) {
        return explicitTz;
    }

    //return null; // ingen magisk fallback her
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

//HH:mm i lokal tid
export function formatToLocalTime(isoString, tz) {
    if (!isoString) {
        return "--:--";
    }

    return new Date(isoString).toLocaleTimeString(UI_LOCALE, {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}


//Dagsetikett: "Mandag 12. feb"
export function formatToLocalDateLabel(isoString, tz) {
    const label = new Date(isoString).toLocaleDateString(UI_LOCALE, {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: tz
    });

    // Kapitaliser første bokstav (nb-NO gir små bokstaver)
    return label.charAt(0).toUpperCase() + label.slice(1);
}


//Kort dato: "man. 12. feb"
export function formatLocalDate(zuluTime, tz) {
    return new Date(zuluTime).toLocaleDateString(UI_LOCALE, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: tz
    });
}


 //Time (0–23) i lokal tid
export function getLocalHour(zuluTime, tz) {
    return Number(
        new Date(zuluTime).toLocaleTimeString(UI_LOCALE, {
            timeZone: tz,
            hour: "numeric",
            hour12: false
        })
    );
}

//Full dato og klokkeslett
export function formatLocalDateTime(timestampMs, tz) {
    return new Date(timestampMs).toLocaleString(UI_LOCALE, {
        timeZone: tz,
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}
