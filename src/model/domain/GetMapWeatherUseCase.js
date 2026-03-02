// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;

        // Kapasitet og begrensninger
        this.maxWeatherLocations = 10;
        this.shuffleBias = 0.5;

        // Definerer rutenett for distribusjon (0.0 til 1.0)
        const EDGE_OFFSET_NEAR = 0.2;
        const CENTER_POSITION = 0.5;
        const EDGE_OFFSET_FAR = 0.8;

        this.gridDistributionSteps = [
            EDGE_OFFSET_NEAR,
            CENTER_POSITION,
            EDGE_OFFSET_FAR
        ];

        this.randomSpreadFactor = 0.2;
        this.randomCenterOffset = 0.5;
    }

    async execute(bbox, timeZone, minDist) {
        try {
            if (!bbox || !Array.isArray(bbox)) {
                return [];
            }

            // 1. Hent faktiske steder fra MapTiler (disse er allerede vasket i Repo)
            let places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox);
            
            if (!places) {
                places = [];
            }

            // 2. Generer koordinater med naturlig spredning (vaskes internt i metoden)
            const scatteredPoints = this.#generateScatteredPoints(bbox);

            // 3. Kombiner
            let combinedPlaces = [...places, ...scatteredPoints];

            // 4. Bruker Fisher–Yates-shuffle
            this.#shuffle(combinedPlaces);

            // 5. Fjern punkter som ligger for tett (minDist er i grader)
            const uniquePlaces = this.#filterTooClose(
                combinedPlaces,
                minDist,
                this.maxWeatherLocations
            );

            // 6. Hent værdata i parallell
            // getCurrentWeatherUseCase håndterer nå sanitizing før MET-kall via DataSource
            const results = await Promise.all(
                uniquePlaces.map(async (place) => {
                    try {
                        const weather = await this.getCurrentWeatherUseCase.execute({
                            lat: place.lat,
                            lon: place.lon,
                            timeZone
                        });

                        if (!weather) {
                            return null;
                        }

                        return {
                            ...weather,
                            ...place
                        };

                    } 
                    catch {
                        return null;
                    }
                })
            );

            return results.filter(Boolean);

        } 
        catch (error) {
            console.error("Feil i GetMapWeatherUseCase:", error);
            return [];
        }
    }

    // Fisher–Yates shuffle (O(n))
    #swap(array, indexA, indexB) {
        [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
    }

    #shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            this.#swap(array, i, j)
        }
    }
    
    #filterTooClose(places, minDist, maxCount) {
        const filtered = [];
        const minDistSquared = minDist * minDist;
        
        let placeIndex = 0;

        while (placeIndex < places.length && filtered.length < maxCount) {
            const currentPoint = places[placeIndex];

            if (this.#isDistanceSafe(currentPoint, filtered, minDistSquared)) {
                filtered.push(currentPoint);
            }

            placeIndex++;
        }

        return filtered;
    }

    #isDistanceSafe(currentPoint, existingPoints, minDistSquared) {
        for (const existing of existingPoints) {
            const a = existing.lat - currentPoint.lat;
            const b = existing.lon - currentPoint.lon;
            
            // Pytagoras a² + b² < c²
            const distanceSquared = a * a + b * b;

            if (distanceSquared < minDistSquared) {
                return false; 
            }
        }
        return true;
    }

    #generateScatteredPoints(bbox) {
        const [west, south, east, north] = bbox;

        const latitudeSpan = north - south;
        const longitudeSpan = east - west;

        const points = [];

        for (const latStep of this.gridDistributionSteps) {
            for (const lonStep of this.gridDistributionSteps) {

                const gridPositionLat = south + (latitudeSpan * latStep);
                const gridPositionLon = west + (longitudeSpan * lonStep);

                const randomOffsetLat =
                    (Math.random() - this.randomCenterOffset)
                    * latitudeSpan
                    * this.randomSpreadFactor;

                const randomOffsetLon =
                    (Math.random() - this.randomCenterOffset)
                    * longitudeSpan
                    * this.randomSpreadFactor;

                // Vasker de genererte koordinatene før de legges til
                // slik at de holder seg innenfor -180 til 180 og -90 til 90
                const finalLat = Math.max(-90, Math.min(90, gridPositionLat + randomOffsetLat));
                const rawLon = gridPositionLon + randomOffsetLon;
                const finalLon = ((rawLon + 180) % 360 + 360) % 360 - 180;

                points.push({
                    lat: finalLat,
                    lon: finalLon,
                    name: ""
                });
            }
        }

        return points;
    }
}