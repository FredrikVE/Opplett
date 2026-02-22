// src/model/repositories/MapTilerRepository.js
export default class MapTilerRepository {
	
	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;
	}

	getMapConfig() {
		return this.dataSource.getBaseConfig();
	}
}