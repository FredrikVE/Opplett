//src/model/datasource/OpenCageGeocodingDataSource.js
const API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;

export default class OpenCageGeocodingDataSource {
	constructor() {
		this.apiCallCount = 0; // teller for å logge antall API-kall (Per side-refresh)
		this.baseUrl = "https://api.opencagedata.com/geocode/v1/";
	}
	
	async get(path, signal) {
		this.apiCallCount += 1;
		
		const url = this.baseUrl + path;
		const startedAt = performance.now();

		console.log(`[OpenCage] API-kall #${this.apiCallCount} -> ${url}`);

		const response = await fetch(url, { headers: { 
			Accept: "application/json" 
		},
		signal
		});
		
		const ms = Math.round(performance.now() - startedAt);

		if (!response.ok) {
			console.warn(`[OpenCage] API-kall #${this.apiCallCount} FEIL (${response.status}) etter ${ms}ms -> ${url}`);
			throw new Error(`HTTP ${response.status}`);
		}

		console.log(`[OpenCage] API-kall #${this.apiCallCount} OK (${response.status}) etter ${ms}ms`);

		return response.json();
	}
	
	// Returnerer liste over forslag
  	async fetchGeocodeData(placeName, signal) {
		const path = `json?q=${encodeURIComponent(placeName)}&key=${API_KEY}&language=no`;
		const data = await this.get(path, signal);

		return data.results.map((r) => ({
			name: r.formatted,
			lat: r.geometry.lat,
			lon: r.geometry.lng,
			timezone: r.annotations?.timezone?.name ?? null,
		}));
	}
}