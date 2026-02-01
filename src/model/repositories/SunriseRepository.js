// src/model/repository/SunriseRepository.js

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

	const formatOptions = {
		timeZone: timeZone ?? "UTC",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	};

	const formatter = new Intl.DateTimeFormat(locale, formatOptions);

	return formatter.format(d);
}


export default class SunriseRepository {

	constructor(sunriseDataSource) {
		this.datasource = sunriseDataSource;
		this.cache = new Map(); // key -> { sunrise:"HH:mm", sunset:"HH:mm" }
	}

	/**
	 * Henter soldata for én dag og returnerer ferdig formatert "HH:mm"
	 * - dateISO: "2026-02-01"
	 * - timeZone: IANA, f.eks. "Europe/Oslo"
	 *
	 * NB: offset sendes ikke => API returnerer UTC. Vi formatterer til lokal tid selv.
	 */
	async getSunTimes(lat, lon, dateISO, timeZone) {
		const cacheKey = `${lat},${lon},${dateISO},${timeZone ?? "UTC"}`;
		const cached = this.cache.get(cacheKey);
			
		if (cached) {
			return cached;
		}

		// offset utelates => UTC-timestamps
		const result = await this.datasource.fetchSunrise(lat, lon, dateISO);
		const p = result?.properties ?? {};

		const out = {
			sunrise: formatHHmm(p.sunrise?.time ?? null, timeZone),
			sunset: formatHHmm(p.sunset?.time ?? null, timeZone),
		};

		this.cache.set(cacheKey, out);
		return out;
	}

	/**
	 * Henter soldata for alle datoer forecast viser ("dd.MM.yyyy")
	 * Returnerer:
	 * {
	 *   "01.02.2026": { sunrise:"08:29", sunset:"16:31" },
	 *   ...
	 * }
	 */
	async getSunTimesForDateLabels(lat, lon, dateLabels, timeZone) {
		const entries = [];
		
		for (const dateLabel of dateLabels ?? []) {
			const dateISO = toISODate(dateLabel);

			if (!dateISO) {
				entries.push([dateLabel, { sunrise: null, sunset: null }]);
				continue;
			}

			try {
				const sun = await this.getSunTimes(lat, lon, dateISO, timeZone);
				entries.push([dateLabel, sun]);
			} 

			catch (error) {
				console.warn("Sunrise-feil for", dateLabel, error);
				entries.push([dateLabel, { sunrise: null, sunset: null }]);
			}
		}
		return Object.fromEntries(entries);
	}
}