//src/model/domain/GetCountryCitiesUseCase.js
export default class GetCountryCitiesUseCase {
    constructor(mapTilerRepository) {
        this.mapTilerRepository = mapTilerRepository;
    }

    async execute(countryCode) {
        if (!countryCode) return [];
        
        console.log("[UseCase] Henter byer for land:", countryCode);
        return await this.mapTilerRepository.getFeaturedCities(countryCode);
    }
}