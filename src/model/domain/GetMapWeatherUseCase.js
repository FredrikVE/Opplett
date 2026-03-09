// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(points, timeZone) {

		console.log("[DEBUG 2] UseCase: Starter værhenting for kartpunkter");

		try {

			if (!points || points.length === 0) {
				console.log("[DEBUG 2] Ingen punkter mottatt.");
				return [];
			}

			console.log(`[DEBUG 2] Mottok ${points.length} kartpunkter.`);

			const weatherPoints = await this.#loadWeatherForPoints(points, timeZone);

			console.log(`[DEBUG 2] UseCase ferdig. Sender ${weatherPoints.length} punkter til VM.`);

			return weatherPoints;

		}
		catch (error) {

			console.error("[DEBUG 2] Kritisk UseCase feil:", error);

			return [];
		}
	}

	async #loadWeatherForPoints(points, timeZone) {

		const weatherResults = [];

		for (const point of points) {

			console.log("[DEBUG 2] Henter vær for:", point.name || "ukjent sted", point.lat, point.lon);

			const weather = await this.getCurrentWeatherUseCase.execute({
				lat: point.lat,
				lon: point.lon,
				timeZone
			});

			if (!weather) {

				console.log("[DEBUG 2] Ingen værdata for punkt:", point);

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