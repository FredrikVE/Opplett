// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;

		//Kapasitet og begrensninger
		this.maxWeatherLocations = 10;
		this.shuffleBias = 0.5;

		//Definerer skjermposisjoner (fra 0.0 som er helt til venstre/bunn til 1.0 som er høyre/topp)
		const EDGE_OFFSET_NEAR = 0.2;
		const CENTER_POSITION = 0.5;
		const EDGE_OFFSET_FAR = 0.8;

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

			//Hent faktiske steder fra MapTiler
			let places = await this.mapTilerRepository.getNearbySignificantPlaces(bbox);
			
			if (!places) {
				places = [];
			}

			//Generer koordinater med naturlig spredning
			const scatteredPoints = this.#generateScatteredPoints(bbox);

			//Kombiner
			let combinedPlaces = [...places, ...scatteredPoints];

			//Bruker Fisher–Yates-shuffle som er mer effektiv
			this.#shuffle(combinedPlaces);

			//Fjern punkter som ligger for tett (stopper tidlig når maks er nådd)
			const uniquePlaces = this.#filterTooClose(
				combinedPlaces,
				minDist,
				this.maxWeatherLocations
			);

			//Hent værdata i parallell
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



	//Fisher–Yates shuffle med kjøretidskompleksitet (O(n))
	#swap(array, indexA, indexB) {
		[array[indexA], array[indexB]] = [array[indexB], array[indexA]];
	}

	#shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			this.#swap(array, i, j)
		}
	}


	//Sjekker avstand mellom punkter ved bruk av Pythagoras.
	#filterTooClose(places, minDist, maxCount) {
		const filtered = [];
		const minDistSquared = minDist * minDist;

		for (const currentPoint of places) {

			let pointsAreTooClose = false;

			for (const existingPoint of filtered) {
				const a = existingPoint.lat - currentPoint.lat;
				const b = existingPoint.lon - currentPoint.lon;

				//Unngår Math.sqrt for bedre ytelse
				const distanceSquared = a * a + b * b;

				if (distanceSquared < minDistSquared) {
					pointsAreTooClose = true;
					break;
				}
			}

			if (!pointsAreTooClose) {
				filtered.push(currentPoint);
			}

			//Tidlig stopp når vi har nok
			if (filtered.length >= maxCount) {
				break;
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

				points.push({
					lat: gridPositionLat + randomOffsetLat,
					lon: gridPositionLon + randomOffsetLon,
					name: ""
				});
			}
		}

		return points;
	}
}