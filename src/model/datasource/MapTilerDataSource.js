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

	async search(query, signal, proximity) {

		console.log("[DEBUG DS] Geocoding search:", query);

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

		console.log("[DEBUG DS] Geocoding results:", locations.length);

		return locations;
	}

	async getLocationGeometry(id) {

		const url = new URL(`${this.#baseUrl}/${id}.json`);
		url.searchParams.set("key", this.#apiKey);

		return this.#fetch(url);
	}

	#isReverseGeocodingQuery(query) {

		if (!query || typeof query !== "string") {
			return false;
		}

		const parts = query.split(",");

		if (parts.length !== 2) {
			return false;
		}

		const lon = Number(parts[0].trim());
		const lat = Number(parts[1].trim());

		return (
			Number.isFinite(lon) &&
			lon >= -180 &&
			lon <= 180 &&
			Number.isFinite(lat) &&
			lat >= -90 &&
			lat <= 90
		);
	}

	#buildSearchUrl(query, proximity) {

		const url = new URL(`${this.#baseUrl}/${encodeURIComponent(query)}.json`);

		url.searchParams.set("key", this.#apiKey);
		url.searchParams.set("language", "no");

		const isReverseGeocoding = this.#isReverseGeocodingQuery(query);

		if (isReverseGeocoding) {

			url.searchParams.set("limit", "1");

		} else {

			url.searchParams.set("limit", "8");

			if (proximity && proximity.lat != null && proximity.lon != null) {

				url.searchParams.set(
					"proximity",
					`${proximity.lon},${proximity.lat}`
				);

			}
		}

		return url;
	}

	async #fetch(url, options = {}) {

		this.apiCallCount++;

		console.log("[DEBUG DS] API call #", this.apiCallCount);

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
			id: feature.id || null,
			name,
			lat,
			lon,
			bounds,
			type,
			timezone,
			countryCode: feature.properties?.country_code || null,
			context: feature.context || []
		};
	}
}