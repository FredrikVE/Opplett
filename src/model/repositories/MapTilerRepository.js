import tzLookup from "tz-lookup";

export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
    }

    /**
     * Sikrer at koordinater er innenfor gyldige grenser.
     */
    #sanitize(lat, lon) {
        return {
            lat: Math.max(-90, Math.min(90, Number(lat))),
            lon: ((Number(lon) + 180) % 360 + 360) % 360 - 180
        };
    }

    /**
     * Henter grunnkonfigurasjon for kartet (API-nøkkel og stil).
     * Stilen er viktig for Marker Layout da den inneholder label-lagene.
     */
    getMapConfig() {
        return this.dataSource.getBaseConfig();
    }

    /**
     * Henter forslag til søkefeltet.
     */
    async getSuggestions(query, signal, proximity) {
        const raw = await this.dataSource.search(query, signal, proximity);
        
        return raw.map(item => {
            const sanitized = this.#sanitize(item.lat, item.lon);
            
            return {
                ...item,
                ...sanitized,
                timezone: item.timezone || tzLookup(sanitized.lat, sanitized.lon)
            };
        });
    }

    async getNearbySignificantPlaces(bbox, zoom) {
        console.log("[DEBUG REPO] Kaller DataSource.getNearbyPlaces...");
        return await this.dataSource.getNearbyPlaces(bbox, zoom);
    }

    /**
     * Reverse geocoding for å finne navn på et spesifikt punkt (f.eks. ved klikk i kart).
     */
    async getCoordinates(lat, lon) {
        const query = `${lon},${lat}`; 
        const results = await this.getSuggestions(query, null);
        return results?.[0] ?? null;
    }
}