//src/model/domain/GetMapConfigUseCase.js
export default class GetMapConfigUseCase {
	
    constructor(mapTilerRepository) {
		this.mapTilerRepository = mapTilerRepository;
	}

	execute() {
		// Synchronous – ingen await, men vi beholder interface
		return this.mapTilerRepository.getMapConfig();
	}
}