// src/model/datasource/MapTilerDataSource.js
const API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

export default class MapTilerDataSource {
    #apiKey;
    #baseUrl;
    #style;

    constructor() {
        if (!API_KEY) {
			throw new Error("Mangler VITE_MAPTILER_API_KEY i .env");
		}

        this.#apiKey = API_KEY;
        this.#baseUrl = "https://api.maptiler.com/geocoding";
        this.#style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.#apiKey}`;
        this.apiCallCount = 0;
    }

    getBaseConfig() {
        return { apiKey: this.#apiKey, style: this.#style };
    }

	//Søker etter geografiske steder ved hjelp av MapTiler Geocoding API.
	async search(query, signal, proximity) {
		const searchUrl = new URL(`${this.#baseUrl}/${encodeURIComponent(query)}.json`);
		searchUrl.searchParams.set("key", this.#apiKey);
		searchUrl.searchParams.set("language", "no");

		//Hvis vi har en referanseposisjon (f.eks. brukerens GPS), prioriterer vi treff i nærheten
		const hasProximity = proximity?.lat != null && proximity?.lon != null;
		if (hasProximity) {
			const proximityValue = `${proximity.lon},${proximity.lat}`;
			searchUrl.searchParams.set("proximity", proximityValue);
		}

		//Utfør selve nettverkskallet via vår interne hjelpemetode
		const apiResponseData = await this.#fetchWithLog(searchUrl, "Search", { signal });

		//Hent ut listen med geografiske treff (Features) fra responsen
		//Vi sikrer oss med en tom liste [] dersom API-et returnerer null/undefined
		const searchResults = apiResponseData?.features || [];

		//Transformer hvert rå-treff fra API-et til vårt interne lokasjonsobjekt
		const mappedLocations = searchResults.map((geoFeature) => {
			return this.#mapFeatureToLocation(geoFeature);
		});

		return mappedLocations;
	}



    //Henter signifikante steder innenfor et bounding box (BBOX)
    /*
    async getNearbyPlaces(bbox) {
        const url = new URL(`${this.#baseUrl}/place.json`);
        url.searchParams.set("key", this.#apiKey);
        url.searchParams.set("bbox", bbox.join(","));
        url.searchParams.set("limit", "10");

        return await this.#fetchWithLog(url, "Nearby");
    }
    */

    async getNearbyPlaces(bbox) {
        const url = new URL(`${this.#baseUrl}/place.json`);
        url.searchParams.set("key", this.#apiKey);
        url.searchParams.set("bbox", bbox.join(","));
        
        // Inkluderer flere lag for å få treff som "Sofies Plass", "Rathkes Plass" etc.
        // 'subdivision' og 'address' gir ofte de lokale navnene du ser på bilde 1.
        url.searchParams.set("types", "city,town,village,subdivision,neighborhood,place"); 
        url.searchParams.set("limit", "10"); 

        return await this.#fetchWithLog(url, "Nearby");
    }



    //PRIVATE HJELPEMETODER
    async #fetchWithLog(url, type, options = {}) {
        this.apiCallCount++;
        const id = this.apiCallCount;

        console.log(`[MapTiler] #${id} (${type}) -> ${url.pathname}`);

        try {
            const response = await fetch(url.toString(), options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`[MapTiler] #${id} OK (Fant ${data.features?.length || 0})`);
            return data;
        } 
		
		catch (error) {

            if (error.name === "AbortError") {
                console.log(`[MapTiler] #${id} Avbrutt`);
            }

			else {
                console.error(`[MapTiler] #${id} FEIL:`, error.message);
            }
            return null;
        }
    }

	#mapFeatureToLocation(searchResult) {
        //akk ut koordinatene fra senterpunktet [longitude, latitude]
        const [lon, lat] = searchResult.center;

        //Pakk ut Bounding Box (utsnitt) hvis det finnes
        // MapTiler bruker formatet: [vest, sør, øst, nord]
        let bounds = null;
        if (searchResult.bbox) {
            const [west, south, east, north] = searchResult.bbox;
            
            bounds = {
                southwest: { lng: west, lat: south },
                northeast: { lng: east, lat: north }
            };
        }

        //Finn tidssone (sjekker både selve punktet og områdene rundt)
        const featureTz = searchResult.properties?.timezone;
        const contextTz = searchResult.context?.find(areaLayer => 
			areaLayer.properties?.timezone
		)?.properties?.timezone;


        const finalTz = featureTz || contextTz || null;

        //Sett sammen det endelige lokasjonsobjektet
        const mappedLocation = {
            name: searchResult.place_name || searchResult.text || "Ukjent sted",
            lat,
            lon,
            bounds,
            type: searchResult.place_type?.[0] || null,
            timezone: finalTz
        };

        return mappedLocation;
    }
}