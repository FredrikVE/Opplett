// src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateMapView(selected) {
    const { type, bounds } = selected;
    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;

    // 1. Map type til et standard zoom-nivå (brukes som fallback eller maxZoom)
    switch (type) {
        case "country":
        case "major_landform":
            targetZoom = MAP_ZOOM_LEVELS.COUNTRY;
            break;
        case "region":
            targetZoom = MAP_ZOOM_LEVELS.REGION;
            break;
        case "subregion":
        case "county":
            targetZoom = MAP_ZOOM_LEVELS.COUNTY;
            break;
        case "city":
        case "municipality":
            targetZoom = MAP_ZOOM_LEVELS.DISTRICT;
            break;
        default:
            targetZoom = MAP_ZOOM_LEVELS.DEFAULT;
    }

    // 2. Bruk bounds hvis de finnes. 
    // Vi fjerner "skipBoundsTypes" fordi MapTiler sin bbox for land som 
    // Danmark og Nederland er presis, og for Norge er den "god nok" 
    // så lenge vi har riktig padding i kartet.
    let targetBbox = null;
    if (bounds) {
        targetBbox = [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    return { 
        zoom: targetZoom, 
        bbox: targetBbox 
    };
}