//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    constructor() {
        this.apiKey = API_KEY;
        this.style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
    }

    getBaseConfig() {
        if (!this.apiKey) {
            throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
        }
        return {
            apiKey: this.apiKey,
            style: this.style
        };
    }
   
    async getNearbyPlaces(bbox) {
        const limit = 10;

        if (!bbox || !Array.isArray(bbox)) {
            throw new Error("bbox mangler i getNearbyPlaces()");
        }

        const bboxString = bbox.join(',');

        const url = `https://api.maptiler.com/geocoding/place.json?key=${this.apiKey}&bbox=${bboxString}&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`MapTiler API feil: ${response.status}`);
        }

        return await response.json();
    }
}