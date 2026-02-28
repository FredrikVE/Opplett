// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
        
        // Cache lagres i minnet på tvers av execute-kall for å spare API-kvote
        this.cache = new Map();
        this.TTL = 10 * 60 * 1000; // 10 minutter
    }

    async execute(lat, lon, timeZone, bbox = null, zoom = 10) {
        try {
            // 1. Hent steder fra MapTiler basert på utsnitt (bbox)
            const places = await this.mapTilerRepository.getNearbySignificantPlaces(lat, lon, bbox);

            if (!places || places.length === 0) return [];

            // 2. Bestem minimum avstand mellom ikoner basert på zoomnivå
            // Verdier er i grader (lat/lon). Jo høyere zoom, jo mindre minDist.
            let minDist = 0.01;
            switch (true) {
                case (zoom <= 5):  minDist = 1.2;   break; // Viser kun storbyer
                case (zoom <= 7):  minDist = 0.5;   break; 
                case (zoom <= 9):  minDist = 0.15;  break; 
                case (zoom <= 11): minDist = 0.04;  break; 
                case (zoom <= 13): minDist = 0.01;  break; 
                case (zoom >= 14): minDist = 0.002; break; // Viser "alt" når vi er tett på
                default:           minDist = 0.01;  break;
            }

            // 3. Filtrer bort steder som ligger for tett på hverandre
            const uniquePlaces = this.#filterTooClose(places, minDist);

            // 4. Hent værdata for de gjenværende punktene (med caching)
            const weatherPromises = uniquePlaces.map(async (place) => {
                const cacheKey = `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;
                const cached = this.cache.get(cacheKey);
                const now = Date.now();

                if (cached && (now - cached.timestamp < this.TTL)) {
                    return { ...cached.data, ...place };
                }

                try {
                    const weather = await this.getCurrentWeatherUseCase.execute({ 
                        lat: place.lat, 
                        lon: place.lon,
                        timeZone 
                    });
                    
                    if (weather) {
                        this.cache.set(cacheKey, { data: weather, timestamp: now });
                        return { ...weather, ...place };
                    }
                    return null;
                } 
                catch (error) {
                    console.error(`Kunne ikke hente vær for ${place.name}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(weatherPromises);
            return results.filter(p => p !== null);

        } catch (error) {
            console.error("Feil i GetMapWeatherUseCase:", error);
            return [];
        }
    }

    /**
     * Algoritme som går gjennom listen og fjerner punkter som ligger for nære
     * et punkt som allerede er lagt til i den filtrerte listen.
     */
    #filterTooClose(places, minDist) {
        const filtered = [];
        places.forEach(p => {
            const isTooClose = filtered.some(f => 
                Math.abs(f.lat - p.lat) < minDist && 
                Math.abs(f.lon - p.lon) < minDist
            );
            if (!isTooClose) {
                filtered.push(p);
            }
        });
        return filtered;
    }
}