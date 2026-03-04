//src/ui/utils/MapUtils/MapZoomHelper.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateMapView(selected) {
    const type = selected.type;
    
    //Default verdier
    let targetZoom = MAP_ZOOM_LEVELS.DEFAULT;
    let targetBbox = null;

    //Bestem zoom-nivå basert på stedstype
    if (type === "country") {
        targetZoom = MAP_ZOOM_LEVELS.COUNTRY;
    }

    else if (type === "region") {
        targetZoom = MAP_ZOOM_LEVELS.REGION;
    }

    else if (type === "county") {
        targetZoom = MAP_ZOOM_LEVELS.COUNTY;
    }

    //Håndter Bounding Box (unntatt for land, hvor vi vil ha fast zoom 3)
    if (selected.bounds && type !== "country") {
        targetBbox = [
            selected.bounds.southwest.lng,
            selected.bounds.southwest.lat,
            selected.bounds.northeast.lng,
            selected.bounds.northeast.lat
        ];
    }

    return { zoom: targetZoom, bbox: targetBbox };
}