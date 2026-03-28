//src/model/datasource/DataSource.js
export default class DataSource {
    constructor() {
        this.apiCallCount = 0;
        this.hostURL = "https://api.met.no/";
    }


    //Hjelpemetode for å rense URL-strengen for ugyldige koordinater før forespørselen sendes til MET.
    #sanitizePath(path) {
        return path.replace(/lat=([-?\d.]+)|lon=([-?\d.]+)/g, (match, latVal, lonVal) => {
            if (latVal !== undefined) {
                const lat = parseFloat(latVal);
                const cleanLat = Math.max(-90, Math.min(90, lat));
                return `lat=${cleanLat}`;
            }
            if (lonVal !== undefined) {
                const lon = parseFloat(lonVal);
                // Normaliserer longitude til -180 til 180 (viktig for New Zealand/stillehavet)
                const cleanLon = ((lon + 180) % 360 + 360) % 360 - 180;
                return `lon=${cleanLon}`;
            }
            return match;
        });
    }

    async get(path) {
        this.apiCallCount += 1;

        // Vask stien før vi bygger den fulle URL-en
        const cleanPath = this.#sanitizePath(path);
        
        const who = this.constructor.name;
        const url = this.hostURL + cleanPath;
        const startedAt = performance.now();

        console.log(`[MET][${who}] API-kall #${this.apiCallCount} -> ${url}`);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Test app for learning MVVM in react",
                Accept: "application/json",
            },
        });

        const ms = Math.round(performance.now() - startedAt);

        if (!response.ok) {
            console.warn(`[MET][${who}] API-kall #${this.apiCallCount} FEIL (${response.status}) etter ${ms}ms -> ${url}`);
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`[MET][${who}] API-kall #${this.apiCallCount} OK (${response.status}) etter ${ms}ms`);

        return response.json();
    }
}