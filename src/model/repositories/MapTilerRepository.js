// src/model/repositories/MapTilerRepository.js
import tzLookup from "tz-lookup"; // Importer pakken

export default class MapTilerRepository {

	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;
	}

	/**
	 * SSOT for koordinat-logikk.
	 * Sørger for at alle koordinater som forlater repositoriet er "vasket".
	 */
	#sanitize(lat, lon) {
		return {
			lat: Math.max(-90, Math.min(90, Number(lat))),
			lon: ((Number(lon) + 180) % 360 + 360) % 360 - 180
		};
	}

	getMapConfig() {
		return this.dataSource.getBaseConfig();
	}

	/**
	 * Henter søkeforslag og injiserer tidssone lokalt.
	 */
	async getSuggestions(query, signal, proximity) {
		const raw = await this.dataSource.search(query, signal, proximity);
		
		return raw.map(item => {
			const sanitized = this.#sanitize(item.lat, item.lon);

			const lookupTz = tzLookup(sanitized.lat, sanitized.lon);

			console.log("TZ DEBUG:", {
				mapTilerTz: item.timezone,
				lookupTz
			});
			
			return {
				...item,
				...sanitized,
				//Her skjer magien: Bruk MapTiler sin tz hvis den finnes, 
				//ellers regn den ut lynraskt basert på koordinater.
				timezone: item.timezone ?? tzLookup(sanitized.lat, sanitized.lon)
			};
		});
	}

	/**
	 * Reverse geocoding (koordinater til navn/tidssone)
	 */
	async getCoordinates(lat, lon) {
		const query = `${lon},${lat}`; 
		const results = await this.getSuggestions(query, null);
		return results?.[0] ?? null;
	}

	/**
	 * Henter steder av interesse innenfor et kartutsnitt (BBOX)
	 */
	async getNearbySignificantPlaces(bbox) {
		const rawData = await this.dataSource.getNearbyPlaces(bbox);
		if (!rawData?.features) return [];

		return rawData.features.map(f => {
			const coords = this.#sanitize(f.center[1], f.center[0]);
			return {
				name: f.text,
				...coords,
				// Vi legger til timezone her også for sikkerhets skyld
				timezone: tzLookup(coords.lat, coords.lon)
			};
		});
	}
}