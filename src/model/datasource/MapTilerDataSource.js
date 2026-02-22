//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    constructor() {
        this.apiKey = API_KEY;
        // FIKS: La til "?key=" og byttet til stabil streets-v2 endepunkt
        this.style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
    }

    getBaseConfig() {
        if (!this.apiKey) {
            throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
        }

        return {
            apiKey: this.apiKey,
            style: this.style,
            defaultCenter: {
                lat: 59.91,
                lon: 10.75
            },
            defaultZoom: 6
        };
    }
}