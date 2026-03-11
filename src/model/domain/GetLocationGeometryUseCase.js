//src/model/domain/GetLocationGeometryUseCase.js
export default class GetLocationGeometryUseCase {

	constructor(mapTilerRepository) {
		this.mapTilerRepository = mapTilerRepository;
	}

	async execute(locationId) {

		if (!locationId) {
			console.warn("[UseCase] Mangler locationId for geometri");
			return null;
		}

		try {

			const geometry = await this.mapTilerRepository.getLocationGeometry(locationId);

			return geometry;

		}
		catch (error) {

			console.error("[UseCase] Klarte ikke hente geometri:", error);

			return null;
		}
	}
}