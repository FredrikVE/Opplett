const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    #apiKey;
    #baseUrl;
    #style;

    constructor() {
        if (!API_KEY) {
            throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
        }

        this.#apiKey = API_KEY;
        this.#baseUrl = "https://api.maptiler.com/geocoding";
        // Bruker streets-v2 som standard stil for kartet
        this.#style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.#apiKey}`;
        this.apiCallCount = 0;
    }

    /**
     * Returnerer konfigurasjon for kart-oppsettet
     */
    getBaseConfig() {
        return { apiKey: this.#apiKey, style: this.#style };
    }

    /**
     * [DEBUG 1] Skanner kartutsnittet (bbox) i et 4x4 grid for å finne steder
     */
    async getNearbyPlaces(bbox, zoom) {
        console.log("[DEBUG 1] DataSource: getNearbyPlaces startet.", { zoom, bbox });
        
        if (!bbox || bbox.length !== 4) {
            console.warn("[DEBUG 1] DataSource: Ugyldig BBOX mottatt:", bbox);
            return [];
        }

        const [minLon, minLat, maxLon, maxLat] = bbox;
        const points = [];
        const steps = 3; // Gir 4x4 = 16 grid-punkter for bedre dekning av skjermen

        for (let i = 0; i <= steps; i++) {
            for (let j = 0; j <= steps; j++) {
                points.push({
                    lon: (minLon + (maxLon - minLon) * (i / steps)).toFixed(6),
                    lat: (minLat + (maxLat - minLat) * (j / steps)).toFixed(6)
                });
            }
        }

        console.log(`[DEBUG 1] DataSource: Skanner ${points.length} koordinater via reverse geocoding...`);

        const results = await Promise.all(points.map(async (p, idx) => {
            // Vi spør etter nærmeste stedsnavn uten å begrense på 'types' for å få flest mulig treff
            const url = `${this.#baseUrl}/${p.lon},${p.lat}.json?key=${this.#apiKey}&language=no`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`[DEBUG 1] API-feil punkt #${idx}: ${response.status}`);
                    return null;
                }
                
                const data = await response.json();
                
                if (!data.features || data.features.length === 0) {
                    return null; 
                }

                // Vi tar det første treffet (vanligvis mest nøyaktig/størst)
                const feature = data.features[0];

                console.log(`[DEBUG 1] Punkt #${idx} (${p.lat}, ${p.lon}) fant: ${feature.text}`);
                
                return {
                    name: feature.text,
                    lat: feature.center[1],
                    lon: feature.center[0]
                };
            } catch (error) {
                console.error(`[DEBUG 1] Nettverksfeil punkt #${idx}:`, error.message);
                return null;
            }
        }));

        // Fjern null-verdier og duplikater (hvis flere grid-punkter traff samme by)
        const seenNames = new Set();
        const uniqueResults = results.filter(f => {
            if (!f || seenNames.has(f.name)) return false;
            seenNames.add(f.name);
            return true;
        });

        console.log(`[DEBUG 1] DataSource ferdig. Fant ${uniqueResults.length} unike steder på skjermen.`);
        return uniqueResults;
    }

    /**
     * Standard søkefunksjon for søkefeltet (Geocoding)
     */
    async search(query, signal, proximity) {
        const searchUrl = new URL(`${this.#baseUrl}/${encodeURIComponent(query)}.json`);
        searchUrl.searchParams.set("key", this.#apiKey);
        searchUrl.searchParams.set("language", "no");

        if (proximity?.lat != null && proximity?.lon != null) {
            searchUrl.searchParams.set("proximity", `${proximity.lon},${proximity.lat}`);
        }

        const apiResponseData = await this.#fetchWithLog(searchUrl, "Search", { signal });
        const searchResults = apiResponseData?.features || [];

        return searchResults.map((geoFeature) => this.#mapFeatureToLocation(geoFeature));
    }

    /**
     * Privat hjelpemetode for fetch med logging av teller
     */
    async #fetchWithLog(url, type, options = {}) {
        this.apiCallCount++;
        const id = this.apiCallCount;
        try {
            const response = await fetch(url.toString(), options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error(`[MapTiler] #${id} (${type}) FEIL:`, error.message);
            }
            return null;
        }
    }

    /**
     * Mapper MapTiler GeoJSON format til vårt interne format
     */
    #mapFeatureToLocation(searchResult) {
        const [lon, lat] = searchResult.center;

        let bounds = null;
        if (searchResult.bbox) {
            const [west, south, east, north] = searchResult.bbox;
            bounds = {
                southwest: { lng: west, lat: south },
                northeast: { lng: east, lat: north }
            };
        }

        const featureTz = searchResult.properties?.timezone;
        const contextTz = searchResult.context?.find(areaLayer => areaLayer.properties?.timezone)?.properties?.timezone;

        return {
            name: searchResult.text || searchResult.place_name || "Ukjent sted",
            lat,
            lon,
            bounds,
            type: searchResult.place_type?.[0] || null,
            timezone: featureTz || contextTz || null
        };
    }
}