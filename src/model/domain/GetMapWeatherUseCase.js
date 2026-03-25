// src/model/domain/GetMapWeatherUseCase.js
//
// Henter værdata for en liste med kartpunkter.
// Punkter fra MarkerLayout har allerede navn.
// Grid-punkter (name === "") reverse-geocodes for å finne nærmeste stedsnavn.

export default class GetMapWeatherUseCase {
	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(points, timeZone) {
		if (!points?.length) return [];

		try {
			const results = await Promise.all(
				points.map((point) => this.#processPoint(point, timeZone))
			);

			return results.filter(Boolean);
		} catch (error) {
			console.error("[GetMapWeatherUseCase] Feil:", error);
			return [];
		}
	}

	async #processPoint(point, timeZone) {
		try {
			const weather = await this.getCurrentWeatherUseCase.execute({
				lat: point.lat,
				lon: point.lon,
				timeZone,
			});

			if (!weather) return null;

			return {
				...point,
				...weather,
				// Grid-punkter (name="") beholder tomt navn.
				// WeatherSymbolLabel viser da kun temperatur + ikon.
				name: point.name || "",
			};
		} 
		
		catch {
			return null;
		}
	}
}