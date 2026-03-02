// src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    constructor() {
        if (!API_KEY) throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
        
        this._baseUrl = "https://api.maptiler.com/geocoding";
        this._apiKey = API_KEY;
        this._style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this._apiKey}`;
        
        // API-teller for overvåking
        this.apiCallCount = 0;
    }

    getBaseConfig() {
        return { apiKey: this._apiKey, style: this._style };
    }

    async search(query, signal, proximity) {
        this.apiCallCount++;
        let url = `${this._baseUrl}/${encodeURIComponent(query)}.json?key=${this._apiKey}&language=no`;
        
        if (proximity && proximity.lat != null && proximity.lon != null) {
            url += `&proximity=${proximity.lon},${proximity.lat}`;
        }

        console.log(`[MapTiler] API-kall #${this.apiCallCount} (Search) -> ${query}`);

        const response = await fetch(url, { signal });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MapTiler] Feil #${this.apiCallCount}:`, response.status, errorText);
            return []; 
        }
        
        const data = await response.json();
        console.log(`[MapTiler] API-kall #${this.apiCallCount} OK (Fant ${data.features?.length || 0} resultater)`);
        
        if (!data.features) return [];

        return data.features.map(f => ({
            name: f.place_name || f.text || "Ukjent sted",
            lat: f.center[1],
            lon: f.center[0],
            bounds: f.bbox ? {
                southwest: { lng: f.bbox[0], lat: f.bbox[1] },
                northeast: { lng: f.bbox[2], lat: f.bbox[3] }
            } : null,
            type: f.place_type ? f.place_type[0] : null,
            timezone: f.properties?.timezone || null
        }));
    }

    async getNearbyPlaces(bbox) {
        this.apiCallCount++;
        const bboxString = bbox.join(",");
        const url = `${this._baseUrl}/place.json?key=${this._apiKey}&bbox=${bboxString}&limit=10`;
        
        console.log(`[MapTiler] API-kall #${this.apiCallCount} (Nearby/Map)`);

        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`[MapTiler] Nearby feilet (#${this.apiCallCount})`);
            return { features: [] };
        }

        const data = await response.json();
        console.log(`[MapTiler] API-kall #${this.apiCallCount} OK (Nearby)`);
        
        return data;
    }
}