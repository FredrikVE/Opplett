//src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
	#getCurrentWeatherUseCase;

	constructor(getCurrentWeatherUseCase) {
		this.#getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(points, timeZone) {
		if (!points?.length) return [];

		try {
			const results = await Promise.all(
				points.map((point) => this.#fetchWeatherForPoint(point, timeZone))
			);

			return results.filter(Boolean);
		} 
		catch (error) {
			console.error("[GetMapWeatherUseCase] Feil:", error);
			return [];
		}
	}

	async #fetchWeatherForPoint(point, timeZone) {
		try {
			const weather = await this.#getCurrentWeatherUseCase.execute({
				lat: point.lat,
				lon: point.lon,
				timeZone,
			});

			if (!weather) {
				return null;
			}

			return {
				...point,
				...weather,
			};
		} 
		
		catch {
			return null;
		}
	}
}