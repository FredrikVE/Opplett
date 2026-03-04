// src/model/domain/GetMapWeatherUseCase.js
import LocationNameFormatter from "../../geolocation/LocationNameFormatter";

export default class GetMapWeatherUseCase {
    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
        
        // Injiserer din legacy formatter for stedsnavn
        this.formatter = new LocationNameFormatter();

        // Konfigurasjon for distribusjon av ikoner
        this.maxWeatherLocations = 10;
        this.gridSteps = [0.2, 0.5, 0.8]; // Ditt 3x3 rutenett
        this.randomSpreadFactor = 0.1;   // Litt "jitter" for naturlig plassering
    }

    /**
     * @param {Array} bbox [west, south, east, north]
     * @param {string} timeZone Tidssone (f.eks "Europe/Oslo")
     * @param {number} minDist Minimumsavstand mellom ikoner (i grader)
     * @param {Object} centerCoords Aktiv lokasjon fra SSOT {lat, lon, name}
     */
    async execute(bbox, timeZone, minDist, centerCoords = null) {
        try {
            if (!bbox || !Array.isArray(bbox)) return [];

            // 1. Generer potensielle punkter fra rutenettet (Din motor)
            let points = this.#generateGridPoints(bbox);

            // 2. Legg til aktiv lokasjon som prioritet (Senter-ankeret)
            // Vi legger den først i arrayen så den alltid "vinner" i avstandsfilteret
            if (centerCoords && centerCoords.lat != null) {
                points.unshift({
                    lat: centerCoords.lat,
                    lon: centerCoords.lon,
                    name: centerCoords.name,
                    isPriority: true
                });
            }

            // 3. Filtrer ut punkter som ligger for tett (Avstandssjekk)
            const uniquePoints = this.#filterPoints(points, minDist);

            // 4. Hent vær og stedsnavn i parallell for de utvalgte punktene
            const results = await Promise.all(
                uniquePoints.map(async (point) => {
                    try {
                        // Hent værdata fra MET via UseCase
                        const weather = await this.getCurrentWeatherUseCase.execute({
                            lat: point.lat,
                            lon: point.lon,
                            timeZone
                        });

                        if (!weather) return null;

                        let finalName = point.name;
                        
                        // Hent og vask navn hvis det mangler (fra grid) eller er generisk
                        if (!finalName || finalName === "" || finalName === "Min posisjon") {
                            const locationInfo = await this.mapTilerRepository.getCoordinates(point.lat, point.lon);
                            
                            // Bruker din legacy-logikk med flagget "isMapIcon = true".
                            // Dette sikrer at vi kun får "Mellombølgen", ikke "Mellombølgen, Oslo".
                            finalName = this.formatter.format(locationInfo, true);
                        }

                        return {
                            ...weather,
                            ...point,
                            name: finalName 
                        };
                    } catch (error) {
                        console.error("Error fetching data for point in GetMapWeatherUseCase:", error);
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

    /**
     * Lager et rutenett med tilfeldig forskyvning
     * @private
     */
    #generateGridPoints(bbox) {
        const [west, south, east, north] = bbox;
        const latSpan = north - south;
        const lonSpan = east - west;
        const points = [];

        for (const latStep of this.gridSteps) {
            for (const lonStep of this.gridSteps) {
                // Beregn grid-posisjon med litt tilfeldig jitter
                const lat = south + (latSpan * latStep) + (Math.random() - 0.5) * latSpan * this.randomSpreadFactor;
                const lon = west + (lonSpan * lonStep) + (Math.random() - 0.5) * lonSpan * this.randomSpreadFactor;

                points.push({
                    lat: Math.max(-90, Math.min(90, lat)),
                    lon: ((lon + 180) % 360 + 360) % 360 - 180,
                    name: "" 
                });
            }
        }
        // Shuffle rutenettet så vi ikke alltid prioriterer samme hjørne av kartet
        return points.sort(() => Math.random() - 0.5);
    }

    /**
     * Fjerner punkter som ligger for nær hverandre
     * @private
     */
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

            // Behold punktet hvis det er trygt eller prioritert
            if (!isTooClose || point.isPriority) {
                filtered.push(point);
            }
        }
        return filtered;
    }
}