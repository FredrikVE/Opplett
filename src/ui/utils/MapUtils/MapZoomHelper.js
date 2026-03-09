// src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateMapView(selected) {
    const { type, bounds } = selected;
    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;

    // Bestem zoom-nivå basert på type (og utstrekning for regioner)
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

    // Ikke bruk bbox for land ennå.
    // MapTiler kan returnere enorme bbox-er for land med fjerne territorier,
    // og da zoomer kartet nesten helt ut.
    // Når vi senere henter full geometri for landet, kan vi fitte på polygon i stedet.
    const skipBoundsTypes = ["country", "major_landform", "continent", "continental_marine"];
    let targetBbox = null;

    if (bounds && !skipBoundsTypes.includes(type)) {
        targetBbox = [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    return { zoom: targetZoom, bbox: targetBbox };
}