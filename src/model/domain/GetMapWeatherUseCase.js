// src/model/domain/GetMapWeatherUseCase.js
import LocationNameFormatter from "../../geolocation/LocationNameFormatter";

export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
        this.formatter = new LocationNameFormatter();

        this.maxWeatherLocations = 10;
        this.gridSteps = [0.2, 0.5, 0.8]; 
        this.randomSpreadFactor = 0.15;
    }

    async execute(bbox, timeZone, minDist, centerCoords = null) {
        try {
            if (!bbox || !Array.isArray(bbox)) return [];

            // 1. HENT EKTE STEDER FRA MAPTILER (Viktigst for naturlig plotting)
            const realPlaces = await this.mapTilerRepository.getNearbySignificantPlaces(bbox);

            // 2. GENERER GRID-PUNKTER (Som backup/fyllmasse)
            const gridPoints = this.#generateGridPoints(bbox);

            // 3. BYGG PRIORITERT LISTE
            let allPotentialPoints = [];

            // A: Prioritet 1 - Aktivt valgt sted (Senter)
            if (centerCoords && centerCoords.lat != null) {
                allPotentialPoints.push({
                    lat: centerCoords.lat,
                    lon: centerCoords.lon,
                    name: centerCoords.name,
                    isPriority: true
                });
            }

            // B: Prioritet 2 - Faktiske steder fra MapTiler
            // Vi shuffler disse litt så vi ikke alltid får nøyaktig de samme 10 hvis det er mange treff
            const shuffledRealPlaces = [...realPlaces].sort(() => Math.random() - 0.5);
            allPotentialPoints.push(...shuffledRealPlaces);

            // C: Prioritet 3 - Grid punkter (Dekker "tomme" områder på kartet)
            allPotentialPoints.push(...gridPoints);

            // 4. FILTRER BASERT PÅ AVSTAND (minDist)
            // Siden vi la ekte steder først i lista, vil disse "vinne" over grid-punktene
            const uniquePoints = this.#filterPoints(allPotentialPoints, minDist);

            // 5. HENT VÆR OG FORMATER NAVN
            const results = await Promise.all(
                uniquePoints.map(async (point) => {
                    try {
                        const weather = await this.getCurrentWeatherUseCase.execute({
                            lat: point.lat,
                            lon: point.lon,
                            timeZone
                        });

                        if (!weather) return null;

                        let finalName = point.name;
                        
                        // Bruk reverse geocoding kun hvis navnet mangler (grid-punkter)
                        if (!finalName || finalName === "" || finalName === "Min posisjon") {
                            const locationInfo = await this.mapTilerRepository.getCoordinates(point.lat, point.lon);
                            finalName = this.formatter.format(locationInfo, true);
                        }

                        return {
                            ...weather,
                            ...point,
                            name: finalName 
                        };
                    } 
                    catch (error) {
                        console.log("Error in the GetMapWeatherUseCase: ", error)
                        return null;
                    }
                })
            );

            return results.filter(Boolean);
        } catch (error) {
            console.error("Feil i GetMapWeatherUseCase:", error);
            return [];
        }
    }

    #generateGridPoints(bbox) {
        const [west, south, east, north] = bbox;
        const latSpan = north - south;
        const lonSpan = east - west;
        const points = [];

        for (const latStep of this.gridSteps) {
            for (const lonStep of this.gridSteps) {
                const lat = south + (latSpan * latStep) + (Math.random() - 0.5) * latSpan * this.randomSpreadFactor;
                const lon = west + (lonSpan * lonStep) + (Math.random() - 0.5) * lonSpan * this.randomSpreadFactor;

                points.push({
                    lat: Math.max(-90, Math.min(90, lat)),
                    lon: ((lon + 180) % 360 + 360) % 360 - 180,
                    name: "" 
                });
            }
        }
        return points;
    }

    #filterPoints(points, minDist) {
        const filtered = [];
        const minDistSq = minDist * minDist;

        for (const point of points) {
            if (filtered.length >= this.maxWeatherLocations) break;

            const isTooClose = filtered.some(existing => {
                const dLat = existing.lat - point.lat;
                const dLon = existing.lon - point.lon;
                return (dLat * dLat + dLon * dLon) < minDistSq;
            });

            // Punktet beholdes hvis det ikke er for nærme noe vi allerede har lagt til,
            // eller hvis det er det absolutte senterpunktet (isPriority).
            if (!isTooClose || point.isPriority) {
                filtered.push(point);
            }
        }
        return filtered;
    }
}