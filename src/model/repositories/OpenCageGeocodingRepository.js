//src/model/repositories/OpenCageGeocodingRepository.js
export default class OpenCageGeocodingRepository {

    constructor(dataSource, nameFormatter) {
        this.dataSource = dataSource;
        this.nameFormatter = nameFormatter; //Sender inn formatter-funksjonen i konstruktøren
    }

    async getSuggestions(query, signal) {
        const rawResults = await this.dataSource.fetchGeocodeData(query, signal);
        
        return rawResults.map(item => ({
            lat: item.lat,
            lon: item.lon,
            // Bruker injectet funksjon, eller fallback hvis den mangler
            name: this.nameFormatter ? this.nameFormatter(item) : (item.name || ''),
            timezone: item.timezone
        }));
    }

    async getCoordinates(query) {
        const results = await this.getSuggestions(query);
        return (results && results.length > 0) ? results[0] : null;
    }
}