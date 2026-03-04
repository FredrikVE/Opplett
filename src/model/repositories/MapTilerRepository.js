// src/model/repositories/MapTilerRepository.js
import tzLookup from "tz-lookup";

export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
    }

    //Privat hjelpemetode for å sikre gyldige koordinater (felles for alle kall)
    #sanitize(lat, lon) {
        return {
            lat: Math.max(-90, Math.min(90, Number(lat))),
            lon: ((Number(lon) + 180) % 360 + 360) % 360 - 180
        };
    }

    getMapConfig() {
        return this.dataSource.getBaseConfig();
    }

    async getSuggestions(query, signal, proximity) {
        const raw = await this.dataSource.search(query, signal, proximity);
        
        return raw.map(item => {
            const sanitized = this.#sanitize(item.lat, item.lon);
            
            //Vi sender med tidssonen fra API-et hvis den finnes, 
            //men vi utfører ikke lenger "Samoa-vaktposten" her.
            //Den jobben gjøres nå sentralt i App.jsx / resolveTimezone.
            return {
                ...item,
                ...sanitized,
                timezone: item.timezone || tzLookup(sanitized.lat, sanitized.lon)
            };
        });
    }

    //Reverse geocoding ved å søke på koordinater som tekst
    async getCoordinates(lat, lon) {
        const query = `${lon},${lat}`; 
        const results = await this.getSuggestions(query, null);
        return results?.[0] ?? null;
    }

    async getNearbySignificantPlaces(bbox) {
        const rawData = await this.dataSource.getNearbyPlaces(bbox);
        if (!rawData?.features) {
            return [];
        }

        return rawData.features.map(feature => {
            const coords = this.#sanitize(feature.center[1], feature.center[0]);
            
            return {
                name: feature.text,
                ...coords,
                timezone: tzLookup(coords.lat, coords.lon)       // Enkel lookup for kart-punkter
            };
        });
    }
}