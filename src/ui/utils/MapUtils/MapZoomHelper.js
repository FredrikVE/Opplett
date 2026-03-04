// src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateMapView(selected) {
    const { type, bounds } = selected;
    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;

    //Bestem zoom-nivå basert på type (og utstrekning for regioner)
    switch (true) {
        case (type === "country" || type === "major_landform"):
            targetZoom = MAP_ZOOM_LEVELS.COUNTRY;
            break;

        case (type === "continent" || type === "continental_marine"):
            targetZoom = MAP_ZOOM_LEVELS.CONTINENT;
            break;

        case (type === "region"): {
            const latDiff = bounds ? (bounds.northeast.lat - bounds.southwest.lat) : 1.0;
            targetZoom = latDiff < 0.5 ? MAP_ZOOM_LEVELS.DEFAULT : MAP_ZOOM_LEVELS.REGION;
            break;
        }

        case (type === "subregion" || type === "county"):
            targetZoom = MAP_ZOOM_LEVELS.COUNTY;
            break;

        case (type === "city" || type === "municipality"):
            targetZoom = MAP_ZOOM_LEVELS.DISTRICT;
            break;

        default:
            targetZoom = MAP_ZOOM_LEVELS.DEFAULT;
            break;
    }

    //Bestem om vi skal bruke Bounding Box (skipper for land/kontinent)
    const largeTypes = ["country", "major_landform", "continent", "continental_marine"];
    let targetBbox = null;

    if (bounds && !largeTypes.includes(type)) {
        targetBbox = [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    return { zoom: targetZoom, bbox: targetBbox };
}