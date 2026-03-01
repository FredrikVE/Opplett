// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

    constructor(mapTilerRepository, getCurrentWeatherUseCase) {
        this.mapTilerRepository = mapTilerRepository;
        this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;

        //Kapasitet og begrensninger
        this.maxWeatherLocations = 10;
        this.shuffleBias = 0.5;

        //Definerer skjermposisjoner (fra 0.0 som er helt til venstre/bunn til 1.0 som er høyre/topp)
        const EDGE_OFFSET_NEAR = 0.2;  // Sikrer dekning nær venstre/nederste kant
        const CENTER_POSITION = 0.5;   // Dekker midten av kartet
        const EDGE_OFFSET_FAR = 0.8;   // Sikrer dekning nær høyre/øverste kant

        this.gridDistributionSteps = [
            EDGE_OFFSET_NEAR, 
            CENTER_POSITION, 
            EDGE_OFFSET_FAR
        ]; 

        //Styrken på den tilfeldige spredningen
        this.randomSpreadFactor = 0.2;
        this.randomCenterOffset = 0.5;
    }

    async execute(bbox, timeZone, minDist) {
        try {
            if (!bbox || !Array.isArray(bbox)) {
                return [];
            }

            //Hent faktiske steder fra MapTiler (byer, tettsteder)
            let places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox);
            if (!places) places = [];

            //Generer koordinater med naturlig spredning
            const scatteredPoints = this.#generateScatteredPoints(bbox);
            
            //Kombiner og stokk rekkefølgen tilfeldig
            let combinedPlaces = [...places, ...scatteredPoints];
			
			//Stokker listen tilfeldig slik at både ekte steder og utkantpunkter 
			//får lik sjanse til å bli vist på kartet.
            combinedPlaces = combinedPlaces.sort(() => 
				Math.random() - this.shuffleBias
			);

            //Fjern punkter som ligger for tett
            const uniquePlaces = this.#filterTooClose(combinedPlaces, minDist);

            //Begrens til kapasiteten definert i instansen
            const limitedPlaces = uniquePlaces.slice(0, this.maxWeatherLocations);

            //Hent værdata i parallell
            const results = await Promise.all(
                limitedPlaces.map(async (place) => {
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

    
    //Privat hjelpemetode som sjekker avstand mellom punkter ved bruk av Pythagoras
	#filterTooClose(places, minDist) {
        const filtered = [];

        for (const currentPoint of places) {
            let pointsAreTooClose = false;

            for (const existingPoint of filtered) {
                const a = existingPoint.lat - currentPoint.lat;
                const b = existingPoint.lon - currentPoint.lon;
                const distance = Math.sqrt(a**2 + b**2);

                if (distance < minDist) {
                    pointsAreTooClose = true;
                    break; 
                }
            }

            if (pointsAreTooClose === false) {
                filtered.push(currentPoint);
            }
        }

        return filtered;
    }


    /**
     * Bruker instansvariabler for å beregne spredte punkter i viewporten
     */
    #generateScatteredPoints(bbox) {
        const [west, south, east, north] = bbox;

        const latitudeSpan = north - south;
        const longitudeSpan = east - west;

        const points = [];

        this.gridDistributionSteps.forEach(latStep => {
            this.gridDistributionSteps.forEach(lonStep => {
                
                //Finn utgangspunktet i rutenettet (gridPosition)
                const gridPositionLat = south + (latitudeSpan * latStep);
                const gridPositionLon = west + (longitudeSpan * lonStep);

                //Beregn et tilfeldig avvik (randomOffset)
                const randomOffsetLat = (Math.random() - this.randomCenterOffset) 
                                        * (latitudeSpan * this.randomSpreadFactor);
                                        
                const randomOffsetLon = (Math.random() - this.randomCenterOffset) 
                                        * (longitudeSpan * this.randomSpreadFactor);

                points.push({
                    lat: gridPositionLat + randomOffsetLat,
                    lon: gridPositionLon + randomOffsetLon,
                    name: "" 
                });
            });
        });

        return points;
    }
}