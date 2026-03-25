//src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
	#apiKey = API_KEY;
	#baseUrl = "https://api.maptiler.com/geocoding";
	#limit = 10; // Sentral styring av antall resultater

	#allowedTypes = ["continental_marine", "major_landform", "country", "region", "subregion", "county", "municipality", "place", "locality", "neighbourhood", "address"];

	constructor() {
		if (!this.#apiKey) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}
	}

	//Henter grunnkonfigurasjon for kartet.
	getBaseConfig() {
		return {
			apiKey: this.#apiKey,
			//style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.#apiKey}`
			style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${this.#apiKey}`
		};
	}

	
	//Utfører søk (fremover eller bakover geokoding).
	async search(query, signal, proximity) {
		if (!query) return [];

		const trimmedQuery = query.trim();
		const isCoords = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(trimmedQuery);
		
		// MapTiler krever rene koordinater i URL-stien ved reverse geocoding
		const searchPath = isCoords ? trimmedQuery : encodeURIComponent(trimmedQuery);
		
		const url = new URL(`${this.#baseUrl}/${searchPath}.json`);
		
		url.searchParams.set("key", this.#apiKey);
		url.searchParams.set("language", "no");
		url.searchParams.set("limit", isCoords ? "1" : `${this.#limit}`);

		//Tvinger API-et til å kun returnere geografiske områder, ikke butikker/POI
		if (!isCoords) {
			url.searchParams.set("types", this.#allowedTypes.join(","));
		}

		if (proximity?.lat != null && proximity?.lon != null) {
			url.searchParams.set("proximity", `${proximity.lon},${proximity.lat}`);
		}

		const response = await fetch(url.toString(), { signal });
		
		if (!response.ok) {
			const errorData = await response.text();
			console.error("[MapTiler] API Feil:", errorData);
			throw new Error(`Søk feilet: ${response.status}`);
		}

		const data = await response.json();
		return (data.features || []).map(f => this.#mapFeatureToLocation(f));
	}



	//Henter full GeoJSON-geometri for et spesifikt sted (brukes til polygon-tegning).
	async getLocationGeometry(id) {
		if (!id) return null;
		
		const url = `${this.#baseUrl}/${id}.json?key=${this.#apiKey}`;
		const response = await fetch(url);
		
		if (!response.ok) throw new Error("Kunne ikke hente geometri");
		
		return response.json();
	}

	//Mapper rå-features fra MapTiler til vår interne domenemodell
	#mapFeatureToLocation(f) {
		const [lon, lat] = f.center;

		return {
			id: f.id,
			name: f.place_name || f.text || "Ukjent sted",
			lat,
			lon,
			type: f.place_type?.[0] || "unknown",
			countryCode: f.properties?.country_code || null,
			bounds: f.bbox ? {
				southwest: { lng: f.bbox[0], lat: f.bbox[1] },
				northeast: { lng: f.bbox[2], lat: f.bbox[3] }
			} : null,
			context: f.context || []
		};
	}
}