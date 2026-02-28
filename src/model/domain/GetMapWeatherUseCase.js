// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
    }

    //Vi tar nå inn minDist direkte i stedet for zoom
    async execute(lat, lon, timeZone, bbox, minDist) {
        try {
            const places = await this.mapTilerRepository.getNearbySignificantPlaces(lat, lon, bbox);
            if (!places || places.length === 0) {
                return [];
            }

            // Bruker minDist sendt fra ViewModel
            const uniquePlaces = this.#filterTooClose(places, minDist);

            const weatherPromises = uniquePlaces.map(async (place) => {
                try {
                    const weather = await this.getCurrentWeatherUseCase.execute({ 
                        lat: place.lat, 
                        lon: place.lon,
                        timeZone 
                    });

                    return weather ? { ...weather, ...place } : null;
                } 
                
                catch (error) { 
                    console.log("Error 1 in GetMapWeatherUseCase()", error);
                    return null; 
                }
            });

            const results = await Promise.all(weatherPromises);
            return results.filter(p => p !== null);
        } 
        
        catch (error) {
            console.log("Error 2 in GetMapWeatherUseCase()", error);
            return [];
        }
    }

    #filterTooClose(places, minDist) {
        const filtered = [];
        for (const p of places) {
            const isTooClose = filtered.some(f => 
                Math.abs(f.lat - p.lat) < minDist && Math.abs(f.lon - p.lon) < minDist
            );
            if (!isTooClose) filtered.push(p);
        }
        return filtered;
    }
}