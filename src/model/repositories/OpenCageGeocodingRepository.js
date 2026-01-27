// src/data/repositories/OpenCageGeocodingRepository.js
export default class OpenCageGeocodingRepository {

    constructor(dataSource) {
        this.dataSource = dataSource;
    }

    async getSuggestions(query, signal) {
        return this.dataSource.fetchGeocodeData(query, signal);
    }

    async getCoordinates(query) {
        const results = await this.getSuggestions(query);

        if (!results.length) {
            return null;
        }

        const first = results[0];

        return {
            lat: first.lat,
            lon: first.lon,
            name: first.name,
            timezone: first.timezone
        };
    }
}
