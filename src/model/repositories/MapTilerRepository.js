import tzLookup from "tz-lookup";

export default class MapTilerRepository {
	
	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;

		// cache for polygon-geometri
		this.geometryCache = new Map();
	}

	// Sikrer at koordinater er innenfor gyldige grenser.
	#sanitize(lat, lon) {

		const numericLat = Number(lat);
		const numericLon = Number(lon);

		const clampedLat = Math.max(-90, Math.min(90, numericLat));
		const normalizedLon = ((numericLon + 180) % 360 + 360) % 360 - 180;

		return {
			lat: clampedLat,
			lon: normalizedLon
		};
	}

	// Henter grunnkonfigurasjon for kartet (API-nøkkel og stil).
	getMapConfig() {

		const config = this.dataSource.getBaseConfig();

		console.log("[DEBUG Repo] Map config hentet:", config);

		return config;
	}

	// Henter forslag til søkefeltet.
	async getSuggestions(query, signal, proximity) {

		console.log("[DEBUG Repo] Søker etter:", query);

		const rawResults = await this.dataSource.search(query, signal, proximity);

		const suggestions = [];

		for (let i = 0; i < rawResults.length; i++) {

			const item = rawResults[i];

			const sanitizedCoords = this.#sanitize(item.lat, item.lon);

			const lat = sanitizedCoords.lat;
			const lon = sanitizedCoords.lon;

			let timezone = item.timezone;

			if (!timezone) {
				try {
					timezone = tzLookup(lat, lon);
				} catch {
					timezone = null;
				}
			}

			const suggestion = {
				...item,
				lat,
				lon,
				timezone
			};

			suggestions.push(suggestion);
		}

		console.log("[DEBUG Repo] Forslag funnet:", suggestions.length);

		return suggestions;
	}

	// Reverse geocoding for å finne navn på et spesifikt punkt
	async getCoordinates(lat, lon) {

		console.log("[DEBUG Repo] Reverse lookup:", lat, lon);

		const query = `${lon},${lat}`;

		const results = await this.getSuggestions(query, null);

		if (!results || results.length === 0) {

			console.log("[DEBUG Repo] Ingen koordinat-resultater.");

			return null;
		}

		const firstResult = results[0];

		console.log("[DEBUG Repo] Reverse lookup resultat:", firstResult);

		return firstResult;
	}

	async getLocationGeometry(id) {

		if (!id) return null;

		// cache-hit
		if (this.geometryCache.has(id)) {
			return this.geometryCache.get(id);
		}

		console.log("[DEBUG Repo] Henter geometri for:", id);

		const geojson = await this.dataSource.getLocationGeometry(id);

		// cache lagring
		this.geometryCache.set(id, geojson);

		return geojson;
	}
}