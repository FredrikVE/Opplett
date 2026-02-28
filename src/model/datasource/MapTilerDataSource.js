const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    constructor() {
        this.apiKey = API_KEY;
        this.style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
    }

    /**
     * Henter grunnkonfigurasjon for kartoppsettet.
     */
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

    /**
     * Henter steder i nærheten eller innenfor et spesifisert kartutsnitt (bbox).
     */
    async getNearbyPlaces(lat, lon, bbox) {
        // MapTiler begrenser oss til 10 resultater per kall
        const limit = 10; 
        let url = "";

        if (bbox && Array.isArray(bbox)) {
            // FORWARD SEARCH I ET OMRÅDE
            // Vi bruker 'place' som type for å finne byer/tettsteder.
            const bboxString = bbox.join(',');
            url = `https://api.maptiler.com/geocoding/place.json?key=${this.apiKey}&bbox=${bboxString}&limit=${limit}&proximity=${lon},${lat}`;
        } else {
            // REVERSE GEOCODING (Ett punkt)
            // Her tillater MapTiler kun én type i parameteren når man bruker koordinater.
            url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${this.apiKey}&types=place&limit=1`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MapTiler API feil (${response.status}): ${errorText}`);
        }

        return await response.json();
    }
}