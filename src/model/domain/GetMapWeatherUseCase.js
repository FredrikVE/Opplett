// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(bbox, timeZone, activeLocation, zoom) {   //minDist er fjernet fra parameteret

		console.log("[DEBUG 2] UseCase: Starter henting av ekte steder...");

		try {

			const nearbyPlaces = await this.#loadNearbyPlaces(bbox, zoom);
			const pointsToFetch = this.#buildPointList(activeLocation,nearbyPlaces);
			const weatherPoints = await this.#loadWeatherForPoints(pointsToFetch, timeZone);

			console.log(`[DEBUG 2] UseCase ferdig. Sender ${weatherPoints.length} punkter til VM.`);

			return weatherPoints;

		} 
        catch (error) {
			console.error("[DEBUG 2] Kritisk UseCase feil:", error);
			return [];
		}
	}

	async #loadNearbyPlaces(bbox, zoom) {

		let places = [];

		try {
			places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox, zoom);

			const count = places ? places.length : 0;
			console.log(`[DEBUG 2] Repo fant ${count} steder.`);

		}

        catch (repoError) {
			console.error("[DEBUG 2] Feil ved henting fra Repo:", repoError);
		}

		return places;
	}

	#buildPointList(activeLocation, places) {

		const points = [];

		//Legg til aktiv lokasjon (SSOT)
		if (activeLocation && activeLocation.lat != null) {
			points.push(activeLocation);
		}

		//Legg til steder fra kartet
        if (places && places.length > 0) {
            for (const place of places) {
                points.push(place);
            }
        }

		return points;
	}

    async #loadWeatherForPoints(points, timeZone) {

        const weatherResults = [];

        for (const point of points) {
            const weather = await this.getCurrentWeatherUseCase.execute({
                lat: point.lat,
                lon: point.lon,
                timeZone
            });

            if (!weather) {
                continue;
            }

            const combinedResult = {
                ...weather,
                ...point
            };

            weatherResults.push(combinedResult);
        }

        return weatherResults;
    }


}