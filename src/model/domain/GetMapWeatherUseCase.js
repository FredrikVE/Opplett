// src/model/domain/GetMapWeatherUseCase.js
export default class GetMapWeatherUseCase {

	constructor(mapTilerRepository, getCurrentWeatherUseCase) {
		this.mapTilerRepository = mapTilerRepository;
		this.getCurrentWeatherUseCase = getCurrentWeatherUseCase;
	}

	async execute(bbox, timeZone, minDist) {

		try {

			if (!bbox || !Array.isArray(bbox)) {
				return [];
			}

			// Hent places fra MapTiler
			let places = await this.mapTilerRepository
				.getNearbySignificantPlaces(bbox);

			if (!places) {
				places = [];
			}

			//Hvis for få steder → bruk radial fallback
			const MIN_PLACE_COUNT = 5;

			if (places.length < MIN_PLACE_COUNT) {
				const radialPoints = this.#generateRadialPoints(bbox);
				places = [...places, ...radialPoints];
			}

			//Fjern punkter som er for tett (ekte avstand, ikke bucket)
			const uniquePlaces = this.#filterTooClose(places, minDist);

			//Begrens antall API-kall
			const MAX_POINTS = 10;
			const limitedPlaces = uniquePlaces.slice(0, MAX_POINTS);

			//Hent vær parallelt
			const results = await Promise.all(
				limitedPlaces.map(async (place) => {

					try {

						const weather = await this.getCurrentWeatherUseCase.execute({
							lat: place.lat,
							lon: place.lon,
							timeZone
						});

						if (!weather) return null;

						return {
							...weather,
							...place
						};

					} catch {
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

	//xBedre avstandsfilter (unngår horisontale belter)
	#filterTooClose(places, minDist) {

		const filtered = [];

		for (const p of places) {

			const isTooClose = filtered.some(f => {

				const dLat = f.lat - p.lat;
				const dLon = f.lon - p.lon;

				const distance = Math.sqrt(dLat * dLat + dLon * dLon);

				return distance < minDist;
			});

			if (!isTooClose) {
				filtered.push(p);
			}
		}

		return filtered;
	}


	#generateRadialPoints(bbox) {
		const [west, south, east, north] = bbox;

		//Geometriske konstanter
		const CENTER_DIVISOR = 2;
		const FULL_CIRCLE_RADIANS = 2 * Math.PI;

		//Radius / ring-konfig
		const RING_COUNT = 2;                   // Antall ringer
		const RADIUS_EXPONENT = 2;     // Hvor aggressivt ringene spres 1.5 er mye, 2 er masse og 3 er ekstrem
		const MAX_RADIUS_DIVISOR = 0.4;           // Bruk halvparten av bbox

		//Punkter per ring-konfig
		const BASE_POINTS_PER_RING = 6;         // Minimum antall
		const POINT_INCREMENT_PER_RING = 3;     // Økning per ring

		const centerLat = (south + north) / CENTER_DIVISOR;
		const centerLon = (west + east) / CENTER_DIVISOR;

		const latSpan = north - south;
		const lonSpan = east - west;

		const maxRadius = Math.min(latSpan, lonSpan) / MAX_RADIUS_DIVISOR;

		const points = [];

		for (let ringIndex = 1; ringIndex <= RING_COUNT; ringIndex++) {

			const normalizedRingPosition = ringIndex / RING_COUNT;

			//Ikke-lineær radius-spredning
			const radius = maxRadius * Math.pow(normalizedRingPosition, RADIUS_EXPONENT);

			const pointsInRing = BASE_POINTS_PER_RING + (ringIndex * POINT_INCREMENT_PER_RING);

			for (let pointIndex = 0; pointIndex < pointsInRing; pointIndex++) {

				const angle = (FULL_CIRCLE_RADIANS * pointIndex) / pointsInRing;
				const lat = centerLat + radius * Math.sin(angle);
				const lon = centerLon + radius * Math.cos(angle);

				points.push({
					lat,
					lon,
					name: ""
				});
			}
		}

		return points;
	}
}