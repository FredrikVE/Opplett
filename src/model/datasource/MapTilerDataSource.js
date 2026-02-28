//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {

	constructor() {

		if (!API_KEY) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}
		
		this._baseUrl = "https://api.maptiler.com";
		this._mapsPath = "/maps";
		this._geocodingPath = "/geocoding";
		this._apiKey = API_KEY;

		this._mapsBaseUrl = `${this._baseUrl}${this._mapsPath}`;
		this._geocodingBaseUrl = `${this._baseUrl}${this._geocodingPath}`;

		this._style = `${this._mapsBaseUrl}/streets-v2/style.json?key=${this._apiKey}`;
	}

	getBaseConfig() {
		return {
			apiKey: this._apiKey,
			style: this._style
		};
	}

	async getNearbyPlaces(bbox) {

		const limit = 10;

		if (!bbox || !Array.isArray(bbox)) {
			throw new Error("bbox mangler i getNearbyPlaces()");
		}

		const bboxString = bbox.join(",");

		//Bygger query string
		const url =
			`${this._geocodingBaseUrl}/place.json` +
			`?key=${this._apiKey}` +
			`&bbox=${bboxString}` +
			`&limit=${limit}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`MapTiler API feil: ${response.status}`);
		}

		return await response.json();
	}
}