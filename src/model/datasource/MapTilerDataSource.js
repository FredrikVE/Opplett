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

    /**
     * Hjelpefunksjon for å tvinge koordinater innenfor -180 til 180 (Longitude)
     * og -90 til 90 (Latitude) for å unngå 400 Bad Request.
     */
    _normalizeCoord(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    async getNearbyPlaces(bbox) {
        const limit = 10;

        if (!bbox || !Array.isArray(bbox)) {
            throw new Error("bbox mangler i getNearbyPlaces()");
        }

        // MapTiler API hater verdier utenfor standard spekter.
        // Vi vasker bbox [minLon, minLat, maxLon, maxLat]
        const sanitizedBbox = bbox.map((coord, index) => {
            const isLongitude = index === 0 || index === 2;
            return isLongitude 
                ? this._normalizeCoord(coord, -180, 180) 
                : this._normalizeCoord(coord, -90, 90);
        });

        const bboxString = sanitizedBbox.join(",");

        const url =
            `${this._geocodingBaseUrl}/place.json` +
            `?key=${this._apiKey}` +
            `&bbox=${bboxString}` +
            `&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`MapTiler API feil URL: ${url}`);
            throw new Error(`MapTiler API feil: ${response.status}`);
        }

        return await response.json();
    }
}