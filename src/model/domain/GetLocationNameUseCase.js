//src/model/domain/GetLocationNameUseCase.js
export default class GetLocationNameUseCase {
	
    constructor(mapTilerRepo) {
		this.mapTilerRepository = mapTilerRepo;
	}

	async execute({ lat, lon }) {
		if (lat == null || lon == null) {
			throw new Error("Latitude and longitude are required");
		}

		return this.mapTilerRepository.getCoordinates(lat, lon);
	}
}