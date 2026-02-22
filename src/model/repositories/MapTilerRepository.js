//src/model/repositories/MapTilerRepository.js
export default class MapTilerRepository {
	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;
	}

	getMapConfig() {
		// Her kan du senere legge til mer logikk:
		// f.eks. forskjellig style for marine, nattmodus, etc.
		const raw = this.dataSource.getBaseConfig();

		return {
			apiKey: raw.apiKey,
			defaultStyle: raw.defaultStyle,
			defaultZoom: raw.defaultZoom,
			defaultCenter: raw.defaultCenter
		};
	}
}