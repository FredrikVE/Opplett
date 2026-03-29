// src/model/domain/GetCurrentWeatherUseCase.js
//
// Ansvar: Hente nåværende vær for en posisjon.
// Mapping-logikken er samlet HER (ikke i repository).

export default class GetCurrentWeatherUseCase {

    constructor(forecastRepository) {
        this.forecastRepository = forecastRepository;
    }

    async execute({ lat, lon, timeZone }) {
        if (!lat || !lon) {
            throw new Error("Latitude and longitude are required");
        }

        // Hent bare én time fra repository
        const hourly = await this.forecastRepository.getHourlyForecast(lat, lon, 1, timeZone);
        const now = hourly?.[0];

        if (!now) {
            return null;
        }

        //Eneste sted vi mapper hourly er currentWeather
        return {
            weatherSymbol: now.weatherSymbol,
            temp: now.temp,
            feelsLike: now.details?.apparent_temperature ?? now.temp,
            precip: now.precipitation?.amount ?? 0,
            wind: now.wind,
            gust: now.details?.wind_speed_of_gust ?? now.wind,
            windDir: now.details?.wind_from_direction ?? 0,
            uv: now.uv ?? 0
        };
    }
}