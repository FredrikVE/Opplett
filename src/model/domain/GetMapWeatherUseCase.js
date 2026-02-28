//src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(bbox, timeZone, minDist) {

		try {

			const places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox);

			if (!places || places.length === 0) {
				return [];
			}

			const uniquePlaces = this.#filterTooClose(places, minDist);

			const results = await Promise.all(
				
				uniquePlaces.map(place => {

					return this.getCurrentWeatherUseCase
					
						.execute({
							lat: place.lat,
							lon: place.lon,
							timeZone: timeZone
						})

						.then(weather => {
							if (!weather) {
								return null;
							}

							return {
								...weather,
								...place
							};
						})

						.catch(() => {
							return null;
						});
				})
			);

			return results.filter(Boolean);

		} 
		
		catch (error) {

			console.error("Feil i GetMapWeatherUseCase:", error);
			return [];
		}
	}

	#filterTooClose(places, minDist) {

		const seen = new Set();
		const filtered = [];

		for (const place of places) {

			const latBucket = Math.floor(place.lat / minDist);
			const lonBucket = Math.floor(place.lon / minDist);
			const key = latBucket + ":" + lonBucket;

			if (!seen.has(key)) {
				seen.add(key);
				filtered.push(place);
			}
		}

		return filtered;
	}
}