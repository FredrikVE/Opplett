// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
    }

    async execute(bbox, timeZone, minDist, activeLocation, zoom) {
        console.log("[DEBUG 2] UseCase: Starter henting av ekte steder...");

        try {
            // 1. Prøv å hente ekte steder fra kartet
            let places = [];
            try {
                places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox, zoom);
                console.log(`[DEBUG 2] Repo fant ${places?.length || 0} steder.`);
            } catch (repoError) {
                console.error("[DEBUG 2] Feil ved henting fra Repo:", repoError);
            }

            // 2. Kombiner med aktiv lokasjon (SSOT) + fallback hvis tomt
            const allPoints = [];
            if (activeLocation?.lat) allPoints.push(activeLocation);
            if (places?.length > 0) allPoints.push(...places);

            // Hvis fortsatt helt tomt (skal ikke skje pga activeLocation), legg til nød-Oslo
            if (allPoints.length === 0) {
                allPoints.push({ name: "Oslo (Fallback)", lat: 59.91, lon: 10.75 }); //dumt å legge inn hardkodete koordinater her. disse bør i såfall settes i App.jsx..
            }

            // 3. Hent vær for alle unike punkter
            const results = await Promise.all(allPoints.map(async (p) => {
                const weather = await this.getCurrentWeatherUseCase.execute({ 
                    lat: p.lat, lon: p.lon, timeZone 
                });
                return weather ? { ...weather, ...p } : null;           //trenger vi alle disse nullsjekkene hele tiden?
            }));

            const final = results.filter(Boolean);
            console.log(`[DEBUG 2] UseCase ferdig. Sender ${final.length} punkter til VM.`);
            return final;

        } catch (error) {
            console.error("[DEBUG 2] Kritisk UseCase feil:", error);
            return [];
        }
    }
}