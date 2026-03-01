//src/model/domain/GetMapConfigUseCase.js
export default class GetMapConfigUseCase {
	
	constructor(mapTilerRepository) {
		this.mapTilerRepository = mapTilerRepository;
	}

	execute() {
		return this.mapTilerRepository.getMapConfig();
	}
}