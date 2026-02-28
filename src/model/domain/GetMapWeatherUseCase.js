// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(lat, lon, timeZone, bbox, minDist) {

		try {

			const places = await this.mapTilerRepository
				.getNearbySignificantPlaces(lat, lon, bbox);

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

		} catch (error) {

			console.error("Feil i GetMapWeatherUseCase:", error);
			return [];
		}
	}

	#filterTooClose(places, minDist) {

		const filtered = [];

		for (const place of places) {

			const isTooClose = filtered.some(existing => {

				const latDiff = Math.abs(existing.lat - place.lat);
				const lonDiff = Math.abs(existing.lon - place.lon);

				return latDiff < minDist && lonDiff < minDist;
			});

			if (!isTooClose) {
				filtered.push(place);
			}
		}

		return filtered;
	}
}