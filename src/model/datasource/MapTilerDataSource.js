// src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
	constructor() {
		this.apiKey = API_KEY;
		this.style = "https://api.maptiler.com/maps/streets-v4/style.json"
	}

	getBaseConfig() {
		if (!this.apiKey) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}

		return {
			apiKey: this.apiKey,

			// Stil flyttet hit
			style: this.style,

			//Defaults flyttet hit
			defaultCenter: {
				lat: 59.91,
				lon: 10.75
			},

			defaultZoom: 6
		};
	}
}