// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
		
		// Cache lagres i minnet på tvers av execute-kall
		this.cache = new Map();
		this.TTL = 10 * 60 * 1000; // 10 minutter
	}

	async execute(lat, lon, timeZone, bbox = null, zoom = 12) {
		try {
			const places = await this.mapTilerRepository.getNearbySignificantPlaces(lat, lon, bbox);

			// Gjenbruker switch-logikken din for avstand
			let minDist = 0.01;
			switch (true) {
				case (zoom <= 5):  minDist = 1.5;   break;
				case (zoom <= 7):  minDist = 0.6;   break;
				case (zoom <= 9):  minDist = 0.2;   break;
				case (zoom <= 11): minDist = 0.05;  break;
				case (zoom >= 14): minDist = 0.004; break;
				default:           minDist = 0.01;  break;
			}

			const uniquePlaces = this.#filterTooClose(places, minDist);

			const weatherPromises = uniquePlaces.map(async (place) => {
				// Lag en unik nøkkel for dette punktet (avrundet til 3 desimaler)
				const cacheKey = `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;
				const cached = this.cache.get(cacheKey);
				const now = Date.now();

				// Hvis vi har fersk data i cachen, bruk den!
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
						// Lagre i cachen før vi returnerer
						this.cache.set(cacheKey, { data: weather, timestamp: now });
						return { ...weather, ...place };
					}
					return null;
				} 
				catch (error) {
					console.log("Bug i GetMapWeatherUseCase()",error)
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

	#filterTooClose(places, minDist) {
		const filtered = [];
		places.forEach(p => {
			const isTooClose = filtered.some(f => 
				Math.abs(f.lat - p.lat) < minDist && 
				Math.abs(f.lon - p.lon) < minDist
			);
			if (!isTooClose) filtered.push(p);
		});
		return filtered;
	}
}