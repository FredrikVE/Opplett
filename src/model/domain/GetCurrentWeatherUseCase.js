//src/model/domain/GetCurrentWeatherUseCase.js
export default class GetCurrentWeatherUseCase {
	
    constructor(forecastRepository) {
		this.forecastRepository = forecastRepository;
	}

	async execute({ lat, lon, timeZone }) {
		if (!lat || !lon) {
			throw new Error("Latitude and longitude are required");
		}

		// Hent bare én time
		const hourly = await this.forecastRepository.getHourlyForecast(lat, lon, 1, timeZone);
		const now = hourly?.[0];

		if (!now) {
			return null;
		}

		return this.#mapHourlyToCurrent(now);
	}

	#mapHourlyToCurrent(hour) {
		return {
			weatherSymbol: hour.weatherSymbol,
			temp: hour.temp,
			feelsLike: hour.details?.apparent_temperature ?? hour.temp,
			precip: hour.precipitation?.amount ?? 0,
			wind: hour.wind,
			gust: hour.details?.wind_speed_of_gust ?? hour.wind,
			windDir: hour.details?.wind_from_direction ?? 0,
			uv: hour.uv ?? 0
		};
	}
}