// src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    constructor() {
        this.apiKey = API_KEY;
        this.baseUrl = "https://api.maptiler.com";
        this.callCount = 0; //Teller for logging av API-klall
    }

    getBaseConfig() {

		//Logg antall api-kall
        this.callCount++;
        console.log(`[MapTilerDataSource] Kall nr: ${this.callCount}`);

        if (!this.apiKey) {
            throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
        }

        return {
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            defaultStyle: "HYBRID",
            defaultZoom: 6,
            defaultCenter: {
                lat: 59.91,
                lon: 10.75
            }
        };
    }
}