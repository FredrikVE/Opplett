//src/model/repositories/MapTilerRepository.js
export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
    }

    /**
     * SSOT for koordinat-logikk.
     * Sørger for at alle koordinater som forlater repositoriet er "vasket".
     */
    #sanitize(lat, lon) {
        return {
            lat: Math.max(-90, Math.min(90, Number(lat))),
            lon: ((Number(lon) + 180) % 360 + 360) % 360 - 180
        };
    }

    getMapConfig() {
        return this.dataSource.getBaseConfig();
    }

    /**
     * Henter søkeforslag. 
     * @param {string} query - Tekstsøket fra brukeren.
     * @param {AbortSignal} signal - For å kunne avbryte søket (debounce).
     * @param {Object} proximity - Valgfri {lat, lon} for å prioritere lokale treff.
     */
    async getSuggestions(query, signal, proximity = null) {
        // Vi sender proximity videre til DataSource
        const raw = await this.dataSource.search(query, signal, proximity);
        
        return raw.map(item => ({
            ...item,
            // Vi saniterer koordinatene her slik at UseCases alltid får rene data
            ...this.#sanitize(item.lat, item.lon)
        }));
    }

    async getCoordinates(lat, lon) {
        // MapTiler Geocoding støtter reverse lookup ved å sende "lon,lat" som query
        const query = `${lon},${lat}`; 
        // Vi trenger ikke proximity for reverse lookup
        return (await this.getSuggestions(query, null))[0] || null;
    }

    async getNearbySignificantPlaces(bbox) {
        const rawData = await this.dataSource.getNearbyPlaces(bbox);
        if (!rawData?.features) return [];

        return rawData.features.map(f => ({
            name: f.text,
            ...this.#sanitize(f.center[1], f.center[0])
        }));
    }
}