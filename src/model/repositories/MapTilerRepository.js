import tzLookup from "tz-lookup";

export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
        this.geometryCache = new Map();
    }

    /**
     * Henter API-nøkkel og stil-URL fra data-kilden.
     */
    getMapConfig() {
        return this.dataSource.getBaseConfig();
    }

    /**
     * Henter forslag basert på søketekst.
     * Vasker koordinater og sikrer at vi har en tidssone.
     */
    async getSuggestions(query, signal, proximity) {
        const rawResults = await this.dataSource.search(query, signal, proximity);

        return rawResults.map(item => {
            const { lat, lon } = this.#sanitize(item.lat, item.lon);
            
            // Bruker eksisterende tidssone eller slår den opp basert på koordinater
            let timezone = item.timezone || null;
            if (!timezone) {
                try {
                    timezone = tzLookup(lat, lon);
                } catch {
                    timezone = null;
                }
            }

            return {
                ...item,
                lat,
                lon,
                timezone
            };
        });
    }

    /**
     * Reverse geocoding (koordinater -> sted)
     */
    async getCoordinates(lat, lon) {
        const query = `${lon},${lat}`;
        const results = await this.getSuggestions(query, null);
        return results?.[0] || null;
    }

    /**
     * Henter og cacher GeoJSON-geometri (for polygon-tegning på kart)
     */
    async getLocationGeometry(id) {
        if (!id) return null;
        if (this.geometryCache.has(id)) return this.geometryCache.get(id);

        const geojson = await this.dataSource.getLocationGeometry(id);
        this.geometryCache.set(id, geojson);
        return geojson;
    }

    /**
     * Sikrer at koordinater holder seg innenfor globale grenser (-90/90 og -180/180)
     */
    #sanitize(lat, lon) {
        const numericLat = Number(lat);
        const numericLon = Number(lon);

        const clampedLat = Math.max(-90, Math.min(90, numericLat));
        const normalizedLon = ((numericLon + 180) % 360 + 360) % 360 - 180;

        return {
            lat: clampedLat,
            lon: normalizedLon
        };
    }
}