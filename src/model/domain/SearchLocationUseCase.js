//src/model/domain/SearchLocationUseCase.js
export default class SearchLocationUseCase {
    
    constructor(mapTilerRepository) {
        this.mapTilerRepository = mapTilerRepository;
    }

    async getSuggestions(query, signal, proximity = null) {
        if (!query || query.trim().length < 3) {
            return [];
        }

        // Vi sender proximity (f.eks. {lat: 59, lon: 10}) videre til repo
        return this.mapTilerRepository.getSuggestions(query.trim(), signal, proximity);
    }

    async getCoordinates(lat, lon) {
        return this.mapTilerRepository.getCoordinates(lat, lon);
    }
}