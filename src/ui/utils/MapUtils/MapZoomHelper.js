// src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS } from "./MapConfig";

export function calculateMapView(selected) {
    const { type, bounds } = selected;
    
    // 1. Definer typer som ofte har "støy" i bounding boksene sine (f.eks. fjerne øyer).
    // Ved å skippe bbox her, tvinger vi kartet til å bruke 'targetZoom' først, 
    // helt til highlightGeometry (polygonet) lastes og gir oss det perfekte utsnittet.
    const skipBoundsTypes = ["country", "continent", "major_landform"];
    
    let targetBbox = null;
    if (bounds && !skipBoundsTypes.includes(type)) {
        targetBbox = [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    // 2. Map type til standard zoom-nivåer fra MapZoomLevels.js
    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;

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

    return { 
        zoom: targetZoom, 
        bbox: targetBbox 
    };
}