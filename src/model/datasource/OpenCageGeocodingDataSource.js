//src/model/datasource/OpenCageGeocodingDataSource.js
const API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;

export default class OpenCageGeocodingDataSource {

    constructor() {
        this.baseUrl = 'https://api.opencagedata.com/geocode/v1/';
    }

    async get(path) {
        const response = await fetch(this.baseUrl + path, {
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    }

    async fetchCoordinates(placeName) {
        try {
            const path = `json?q=${encodeURIComponent(placeName)}&key=${API_KEY}&language=no&pretty=1`;
            const data = await this.get(path);

            if (data?.results?.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                return { lat, lon: lng };
            }

            throw new Error('Fant ikke sted');
        } 
        
        catch (error) {
            console.error('Geokoding-feil:', error);
            return null;
        }
    }

    // Returnerer liste over forslag
    async fetchGeocodeData(placeName) {
        const path = `json?q=${encodeURIComponent(placeName)}&key=${API_KEY}&language=no`;
        const data = await this.get(path);

        return data.results.map(r => ({
            name: r.formatted,
            lat: r.geometry.lat,
            lon: r.geometry.lng,
            timezone: r.annotations?.timezone?.name ?? null
        }));
    }
}
