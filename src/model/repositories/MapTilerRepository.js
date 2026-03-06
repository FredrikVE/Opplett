import tzLookup from "tz-lookup";

export default class MapTilerRepository {

	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;
	}

	//Sikrer at koordinater er innenfor gyldige grenser.
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


	//Henter grunnkonfigurasjon for kartet (API-nøkkel og stil).
	getMapConfig() {
		const config = this.dataSource.getBaseConfig();
		return config;
	}


	//Henter forslag til søkefeltet.
	async getSuggestions(query, signal, proximity) {

		const rawResults = await this.dataSource.search(query, signal, proximity);
		
        const suggestions = [];

		for (let i = 0; i < rawResults.length; i++) {
			const item = rawResults[i];
			const sanitizedCoords = this.#sanitize(item.lat, item.lon);
			const lat = sanitizedCoords.lat;
			const lon = sanitizedCoords.lon;

			let timezone = item.timezone;

			if (!timezone) {
				timezone = tzLookup(lat, lon);
			}

			const suggestion = {
				...item,
				lat: lat,
				lon: lon,
				timezone: timezone
			};

			suggestions.push(suggestion);
		}

		return suggestions;
	}

	async getNearbySignificantPlaces(bbox, zoom) {
		const places = await this.dataSource.getNearbyPlaces(bbox, zoom);
		return places;
	}

	
	//Reverse geocoding for å finne navn på et spesifikt punkt
	async getCoordinates(lat, lon) {

		const query = `${lon},${lat}`;

		const results =
			await this.getSuggestions(query, null);

		if (!results || results.length === 0) {
			return null;
		}

		const firstResult = results[0];

		return firstResult;
	}
}