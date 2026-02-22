// src/model/repositories/MapTilerRepository.js
export default class MapTilerRepository {
	
	constructor(mapTilerDataSource) {
		this.dataSource = mapTilerDataSource;
	}

	//Henter grunnkonfigurasjon for kartet fra DataSource.
	getMapConfig() {
		return this.dataSource.getBaseConfig();
	}

	async getNearbySignificantPlaces(lat, lon, bbox = null) {
		// Vi sender bbox videre til DataSource for å få steder innenfor kartutsnittet
		const rawData = await this.dataSource.getNearbyPlaces(lat, lon, bbox);
		
		//MapTiler returnerer en GeoJSON FeatureCollection.
		//Vi sjekker at vi faktisk fikk data tilbake
		if (!rawData || !rawData.features) {
			return [];
		}

		//Vi mapper features til et format domenet vårt forstår.
		return rawData.features.map(feature => ({
			name: feature.text,				// Stedets navn (f.eks. "Lambertseter")
			lat: feature.center[1],			// MapTiler bruker [lon, lat], så vi snur dem
			lon: feature.center[0]			// til [lat, lon] som resten av appen bruker
		}));
	}
}