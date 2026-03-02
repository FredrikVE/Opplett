// src/model/repositories/OpenCageGeocodingRepository.js
export default class OpenCageGeocodingRepository {

	constructor(dataSource, nameFormatter) {
		this.dataSource = dataSource;
		this.nameFormatter = nameFormatter;
	}

	async getSuggestions(query, signal) {

		const rawResults = await this.dataSource.fetchGeocodeData(query, signal);
		
		return rawResults.map(item => ({

			lat: item.lat,
			lon: item.lon,

			// Formatter navn hvis tilgjengelig
			name: this.nameFormatter
				? this.nameFormatter(item)
				: (item.name || ''),

			timezone: item.timezone,

			// 🆕 VIDEREFØR bounds
			bounds: item.bounds ?? null,

			// 🆕 VIDEREFØR type (country, city, etc.)
			type: item.type ?? null

		}));
	}

	async getCoordinates(lat, lon) {
		const query = `${lat},${lon}`;
		const results = await this.getSuggestions(query);
		return results?.[0] ?? null;
	}
}