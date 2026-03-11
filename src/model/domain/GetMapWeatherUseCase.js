//src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
    }

    async execute(points, timeZone) {
        if (!points?.length) return [];

        try {
            // Vi kjører alle kallene parallelt med Promise.all for mye bedre hastighet
            const weatherPromises = points.map(async (point) => {
                const weather = await this.getCurrentWeatherUseCase.execute({
                    lat: point.lat,
                    lon: point.lon,
                    timeZone
                });

                if (!weather) return null;

                // Slå sammen dataene rett i returen
                return {
                    ...point, // Beholder ID, navn, koordinater fra kartet
                    ...weather, // Legger på temperatur og symbol
                };
            });

            const results = await Promise.all(weatherPromises);
            
            // Filtrer bort de som feilet (null)
            return results.filter(Boolean);

        } catch (error) {
            console.error("[GetMapWeatherUseCase] Feil:", error);
            return [];
        }
    }
}