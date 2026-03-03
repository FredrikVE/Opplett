// src/model/repositories/MapTilerRepository.js
import tzLookup from "tz-lookup";

export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
    }

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
            const apiTimezone = item.timezone; 
            const lookupTimezone = tzLookup(sanitized.lat, sanitized.lon);

            let finalTz = apiTimezone || lookupTimezone;

            // --- DEN NYE, SMARTERE DATOLINJE-VAKTPOSTEN ---
            
            // Vi sjekker om stedsnavnet inneholder "Amerikansk Samoa" eller "American Samoa"
            const isAmericanSamoa = item.name.toLowerCase().includes("samoa") && 
                                   (item.name.toLowerCase().includes("amerikansk") || 
                                    item.name.toLowerCase().includes("american"));

            // Hvis det ER Amerikansk Samoa, men tz-lookup tror det er Apia (+13): Tving til Pago Pago (-11)
            if (isAmericanSamoa && finalTz === "Pacific/Apia") {
                finalTz = "Pacific/Pago_Pago";
            } 
            
            // Hvis det IKKE er Amerikansk Samoa (altså selvstendige Samoa), 
            // men longitude er i området, stoler vi på at Apia (+13) er riktig.
            // Dette sørger for at Apia-søket ditt forblir på onsdag 4. mars.

            return {
                ...item,
                ...sanitized,
                timezone: finalTz
            };
        });
    }

    async getCoordinates(lat, lon) {
        const query = `${lon},${lat}`; 
        const results = await this.getSuggestions(query, null);
        return results?.[0] ?? null;
    }

    async getNearbySignificantPlaces(bbox) {
        const rawData = await this.dataSource.getNearbyPlaces(bbox);
        if (!rawData?.features) return [];

        return rawData.features.map(f => {
            const coords = this.#sanitize(f.center[1], f.center[0]);
            // For markører i kartet bruker vi land-sjekk her også hvis nødvendig,
            // men ofte er f.text (navnet) nok til å kjøre samme logikk.
            return {
                name: f.text,
                ...coords,
                timezone: tzLookup(coords.lat, coords.lon)
            };
        });
    }
}