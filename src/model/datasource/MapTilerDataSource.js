//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {

	constructor() {
		this.apiKey = API_KEY;
		this.baseUrl = "https://api.maptiler.com";
	}

	getBaseConfig() {
		if (!this.apiKey) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}

		return {
			apiKey: this.apiKey,
			baseUrl: this.baseUrl,

			// Domain-nært kartoppsett (kan endres uten å røre View)
			defaultStyle: "HYBRID",    // eller "STREETS", "OUTDOOR", etc.
			defaultZoom: 6,
			defaultCenter: {
				lat: 59.91,   // Oslo som fallback
				lon: 10.75
			}
		};
	}
}