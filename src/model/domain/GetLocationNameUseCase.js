//src/model/domain/GetLocationNameUseCase.js
export default class GetLocationNameUseCase {
	
    constructor(geocodingRepository) {
		this.geocodingRepository = geocodingRepository;
	}

	async execute({ lat, lon }) {
		if (lat == null || lon == null) {
			throw new Error("Latitude and longitude are required");
		}

		return this.geocodingRepository.getCoordinates(lat, lon);
	}
}