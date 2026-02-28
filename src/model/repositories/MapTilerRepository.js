// src/model/repositories/MapTilerRepository.js
export default class MapTilerRepository {
    constructor(mapTilerDataSource) {
        this.dataSource = mapTilerDataSource;
    }

    getMapConfig() {
        return this.dataSource.getBaseConfig();
    }

    async getNearbySignificantPlaces(lat, lon, bbox) {
        const rawData = await this.dataSource.getNearbyPlaces(lat, lon, bbox);
        
        if (!rawData || !rawData.features) {
			return [];
		}

        return rawData.features.map(feature => ({
            name: feature.text,
            lat: feature.center[1],
            lon: feature.center[0]
        }));
    }
}