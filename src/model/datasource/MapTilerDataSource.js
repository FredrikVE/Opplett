const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
	#apiKey;
	#baseUrl;
	#styleUrl;

	constructor() {
		if (!API_KEY) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}

		this.#apiKey = API_KEY;
		this.#baseUrl = "https://api.maptiler.com/geocoding";
		this.#styleUrl = "https://api.maptiler.com/maps/streets-v2/style.json";

		this.apiCallCount = 0;
	}

	getBaseConfig() {
		return {
			apiKey: this.#apiKey,
			style: `${this.#styleUrl}?key=${this.#apiKey}`
		};
	}

	async getNearbyPlaces(bbox) {
		
		if (!this.#isValidBBox(bbox)) {
			console.warn("Ugyldig bbox:", bbox);
			return [];
		}
        const gridSize = 4;
		const gridPoints = this.#createGridPoints(bbox, gridSize);

		const promises = [];

		for (let i = 0; i < gridPoints.length; i++) {
			const point = gridPoints[i];
			promises.push(this.#reverseGeocode(point, i));
		}

		const results = await Promise.all(promises);
		const uniquePlaces = this.#removeDuplicatePlaces(results);

        return uniquePlaces;
	}

	async search(query, signal, proximity) {
		const url = this.#buildSearchUrl(query, proximity);
		const data = await this.#fetch(url, { signal });

		const locations = [];

		if (data && data.features) {
			for (let i = 0; i < data.features.length; i++) {
				const feature = data.features[i];
				const location = this.#mapFeatureToLocation(feature);
				locations.push(location);
			}
		}

		return locations;
	}

	#isValidBBox(bbox) {
		return Array.isArray(bbox) && bbox.length === 4;
	}

    #createGridPoints(bbox, gridSize) {
        const west = bbox[0];
        const south = bbox[1];
        const east = bbox[2];
        const north = bbox[3];

        const points = [];

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const lon = west + (east - west) * (x / (gridSize - 1));
                const lat = south + (north - south) * (y / (gridSize - 1));

                points.push({ lon: lon, lat: lat });
            }
        }

        return points;
    }


	async #reverseGeocode(point, index) {
		const lon = point.lon;
		const lat = point.lat;

		const url = `${this.#baseUrl}/${lon},${lat}.json?key=${this.#apiKey}&language=no`;

		try {
			const data = await this.#fetch(url);

			if (!data || !data.features || data.features.length === 0) {
				return null;
			}

			const feature = data.features[0];

			return {
				name: feature.text,
				lat: feature.center[1],
				lon: feature.center[0]
			};
		}
		catch (error) {
			console.error(`Reverse geocode feilet (#${index}):`, error.message);
			return null;
		}
	}

	#removeDuplicatePlaces(results) {
		const seen = new Set();
		const unique = [];

		for (let i = 0; i < results.length; i++) {
			const place = results[i];

			if (!place) {
				continue;
			}

			if (seen.has(place.name)) {
				continue;
			}

			seen.add(place.name);
			unique.push(place);
		}

		return unique;
	}

	#buildSearchUrl(query, proximity) {
		const url = new URL(`${this.#baseUrl}/${encodeURIComponent(query)}.json`);

		url.searchParams.set("key", this.#apiKey);
		url.searchParams.set("language", "no");

		if (proximity && proximity.lat != null && proximity.lon != null) {
			url.searchParams.set("proximity", `${proximity.lon},${proximity.lat}`);
		}

		return url;
	}

	async #fetch(url, options = {}) {
		this.apiCallCount++;

		const response = await fetch(url.toString(), options);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return response.json();
	}

    #mapFeatureToLocation(feature) {
        const lon = feature.center[0];
        const lat = feature.center[1];

        let bounds = null;

        if (feature.bbox) {
            const west = feature.bbox[0];
            const south = feature.bbox[1];
            const east = feature.bbox[2];
            const north = feature.bbox[3];

            bounds = {
                southwest: { lng: west, lat: south },
                northeast: { lng: east, lat: north }
            };
        }

        let timezone = null;

        if (feature.properties && feature.properties.timezone) {
            timezone = feature.properties.timezone;
        } else if (feature.context) {
            for (let i = 0; i < feature.context.length; i++) {
                const ctx = feature.context[i];

                if (ctx.properties && ctx.properties.timezone) {
                    timezone = ctx.properties.timezone;
                    break;
                }
            }
        }

        let name = feature.text || feature.place_name || "Ukjent sted";

        let type = null;

        if (feature.place_type && feature.place_type.length > 0) {
            type = feature.place_type[0];
        }

        return {
            name: name,
            lat: lat,
            lon: lon,
            bounds: bounds,
            type: type,
            timezone: timezone
        };
    }

}