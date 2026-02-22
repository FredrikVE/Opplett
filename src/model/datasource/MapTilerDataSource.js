const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
	constructor() {
		this.apiKey = API_KEY;
		this.style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
	}


	//Henter grunnkonfigurasjon for kartoppsettet.
	getBaseConfig() {
		if (!this.apiKey) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}

		return {
			apiKey: this.apiKey,
			style: this.style,
			defaultCenter: {
				lat: 59.91,
				lon: 10.75
			},
			defaultZoom: 12
		};
	}

	async getNearbyPlaces(lat, lon, bbox) {
		// Vi bruker 'place' for å finne byer/tettsteder
		const type = "place";
		const limit = 10; 			// 10 er maksgrense
		
		// MapTiler krever rekkefølgen longitude, latitude i URL-stien
		let url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${this.apiKey}&types=${type}&limit=${limit}`;

		// Hvis vi har bounds fra kartet, legger vi til bbox-parameteren
		if (bbox) {
			url += `&bbox=${bbox.join(',')}`;
		}

		const response = await fetch(url);
		
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`MapTiler API feil (${response.status}): ${errorText}`);
		}

		return await response.json();
	}
}