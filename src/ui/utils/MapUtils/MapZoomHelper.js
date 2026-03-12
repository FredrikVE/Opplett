// src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS, LOCATION_TYPES } from "./MapConfig";

export function calculateMapView(selected) {
    const { type, bounds } = selected;

    // Typer som ofte har "støy" i bbox (fjerne øyer osv.)
    const skipBoundsTypes = [
        LOCATION_TYPES.COUNTRY,
        LOCATION_TYPES.CONTINENT,
        LOCATION_TYPES.MAJOR_LANDFORM
    ];

    let targetBbox = null;
    if (bounds && !skipBoundsTypes.includes(type)) {
        targetBbox = [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;

    switch (type) {
        case LOCATION_TYPES.COUNTRY:
        case LOCATION_TYPES.MAJOR_LANDFORM:
            targetZoom = MAP_ZOOM_LEVELS.COUNTRY;
            break;

        case LOCATION_TYPES.REGION:
            targetZoom = MAP_ZOOM_LEVELS.REGION;
            break;

        case LOCATION_TYPES.SUBREGION:
        case LOCATION_TYPES.COUNTY:
            targetZoom = MAP_ZOOM_LEVELS.COUNTY;
            break;

        case LOCATION_TYPES.CITY:
        case LOCATION_TYPES.MUNICIPALITY:
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