//src/model/datasource/MetAlertsDataSource.js
import DataSource from "./DataSource.js";

export default class MetAlertsDataSource extends DataSource {
	
	async fetchMetalerts(lat, lon) {
		const path = `weatherapi/metalerts/2.0/current.json?lat=${lat}&lon=${lon}`;
		return this.get(path);
	}

	async fetchAllMetalerts(countyId = null) {
		let path = `weatherapi/metalerts/2.0/current.json`;
		
		if (countyId) {
			path += `?county=${countyId}`;
		}

		return this.get(path);
	}
}