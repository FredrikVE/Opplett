// src/model/domain/SearchLocationUseCase.js
export default class SearchLocationUseCase {
	
	constructor(geocodingRepository) {
		this.geocodingRepository = geocodingRepository;
	}

	async getSuggestions(query, signal) {
		if (!query || query.trim().length < 3) {
			return [];
		}

		return this.geocodingRepository.getSuggestions(query.trim(), signal);
	}

	async getCoordinates(lat, lon) {
		return this.geocodingRepository.getCoordinates(lat, lon);
	}
}