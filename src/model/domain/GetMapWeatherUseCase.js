// src/model/domain/GetMapWeatherUseCase.js
//
// Henter værdata for en liste med kartpunkter.
//
// Tar imot ferdige punkter (med navn og koordinater) fra UI-laget
// og beriker dem med værdata fra getCurrentWeatherUseCase.
//
// Grid-punkter (name === "") vises med kun temperatur og ikon,
// uten stedsnavn — dette håndteres av WeatherSymbolLabel.

export default class GetMapWeatherUseCase {
	#getCurrentWeatherUseCase;

	constructor(getCurrentWeatherUseCase) {
		// mapTilerRepository beholdes i signaturen for bakoverkompatibilitet
		// med App.jsx, men brukes ikke lenger.
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