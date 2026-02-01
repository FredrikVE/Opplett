// src/model/repository/SunriseRepository.js

// "11.02.2026" -> "2026-02-11"
function toISODate(dateLabel) {
  if (!dateLabel) return null;
  const [dd, mm, yyyy] = dateLabel.split(".");
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; // padder også dag
}

/**
 * Returnerer offset-string "+01:00", "-05:00", osv. for en gitt dato i en IANA timeZone.
 * dateISO: "2026-02-01"
 * timeZone: "America/New_York"
 */
function getOffsetForDateInTimeZone(dateISO, timeZone) {
  try {
    const [y, m, d] = dateISO.split("-").map(Number);

    // Bruk 12:00 UTC for å unngå hjørnetilfeller rundt midnatt
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const parts = Object.fromEntries(
      dtf
        .formatToParts(utcDate)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value])
    );

    // parts beskriver "lokal tid" i timeZone. Tolk den som UTC for å finne offset-minutter.
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    const offsetMinutes = Math.round((asUTC - utcDate.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `${sign}${hh}:${mm}`;
  } catch {
    // Hvis timeZone er ugyldig/mangler: fall tilbake til UTC
    return "+00:00";
  }
}

export default class SunriseRepository {
  constructor(sunriseDataSource) {
    this.datasource = sunriseDataSource;
    this.cache = new Map(); // key -> { sunrise, sunset }
  }

  async getSunTimes(lat, lon, dateISO, offset) {
    const key = `${lat},${lon},${dateISO},${offset}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const result = await this.datasource.fetchSunrise(lat, lon, dateISO, offset);
    const properties = result.properties;

    const out = {
      // Sunrise-API returnerer ISO-tid med offset — vi tar kun "HH:MM"
      sunrise: properties.sunrise?.time?.slice(11, 16) ?? null,
      sunset: properties.sunset?.time?.slice(11, 16) ?? null,
    };

    this.cache.set(key, out);
    return out;
  }

  /**
   * Henter soldata for alle dagene (dateLabels) som forecast viser.
   * Returnerer:
   * {
   *   "01.02.2026": { sunrise:"07:58", sunset:"16:31" },
   *   ...
   * }
   */
  async getSunTimesForDateLabels(lat, lon, dateLabels, timeZone) {
    const entries = await Promise.all(
      (dateLabels ?? []).map(async (dateLabel) => {
        const dateISO = toISODate(dateLabel);
        if (!dateISO) return [dateLabel, { sunrise: null, sunset: null }];

        const offset = timeZone
          ? getOffsetForDateInTimeZone(dateISO, timeZone)
          : "+00:00";

        try {
          const sun = await this.getSunTimes(lat, lon, dateISO, offset);
          return [dateLabel, sun];
        } catch (e) {
          console.warn("Sunrise-feil for", dateLabel, e);
          return [dateLabel, { sunrise: null, sunset: null }];
        }
      })
    );

    return Object.fromEntries(entries);
  }
}
