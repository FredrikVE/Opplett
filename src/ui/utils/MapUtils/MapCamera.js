//src/ui/utils/MapUtils/MapCamera.js
import { MAP_CAMERA, MAP_ZOOM_LEVELS, isAreaLocation, shouldUseSearchBounds, getDefaultZoomForLocationType } from "./MapConfig.js";

const roundCoord = (value) => {
    Number(value ?? 0);
}

/*
function estimateZoomFromBounds(bounds) {

    const [west, south, east, north] = bounds;

    const latDiff = Math.abs(north - south);
    const lonDiff = Math.abs(east - west);

    const maxDiff = Math.max(latDiff, lonDiff);

    if (maxDiff > 120) return 2;
    if (maxDiff > 60) return 2.5;
    if (maxDiff > 30) return 3;
    if (maxDiff > 15) return 3.5;
    if (maxDiff > 8) return 4;
    if (maxDiff > 4) return 5;
    if (maxDiff > 2) return 6;
    if (maxDiff > 1) return 7;
    if (maxDiff > 0.5) return 8;
    if (maxDiff > 0.2) return 9;

    return 10;
}
*/

function estimateZoomFromBounds(bounds) {

    const [west, south, east, north] = bounds;

    const latDiff = Math.abs(north - south);
    const lonDiff = Math.abs(east - west);

    const maxDiff = Math.max(latDiff, lonDiff);

    if (maxDiff > 120) return MAP_ZOOM_LEVELS.WORLD;
    if (maxDiff > 60) return MAP_ZOOM_LEVELS.WORLD_CLOSE;
    if (maxDiff > 30) return MAP_ZOOM_LEVELS.COUNTRY;
    if (maxDiff > 15) return MAP_ZOOM_LEVELS.COUNTRY_CLOSE;
    if (maxDiff > 8) return MAP_ZOOM_LEVELS.REGION_WIDE;
    if (maxDiff > 4) return MAP_ZOOM_LEVELS.REGION;
    if (maxDiff > 2) return MAP_ZOOM_LEVELS.SUB_REGION;
    if (maxDiff > 1) return MAP_ZOOM_LEVELS.COUNTY;
    if (maxDiff > 0.5) return MAP_ZOOM_LEVELS.DISTRICT;
    if (maxDiff > 0.2) return MAP_ZOOM_LEVELS.CITY;
    
    return MAP_ZOOM_LEVELS.STREET;
}


export function normalizeBounds(bounds) {
    if (!bounds) {
        return null;
    }

    // [west, south, east, north]
    if ( Array.isArray(bounds) && bounds.length === 4 && bounds.every((v) => typeof v === "number")) {
        return bounds;
    }

    // [[west, south], [east, north]]
    if (Array.isArray(bounds) && bounds.length === 2 && Array.isArray(bounds[0]) && Array.isArray(bounds[1])) {
        const [[west, south], [east, north]] = bounds;
        return [west, south, east, north];
    }

    // MapTiler geocoding bounds-objekt
    if (bounds?.southwest && bounds?.northeast) {
        return [
            bounds.southwest.lng,
            bounds.southwest.lat,
            bounds.northeast.lng,
            bounds.northeast.lat
        ];
    }

    return null;
}

export function getSearchBoundsForLocation(location) {
    const bounds = normalizeBounds(location?.bounds);
    if (!bounds) {
        return null;
    }

    if (!shouldUseSearchBounds(location?.type)) {
        return null;
    }

    return bounds;
}

export function buildFallbackCenter(location) {
    return {
        lat: location?.lat ?? 0,
        lon: location?.lon ?? 0,
        zoom: getDefaultZoomForLocationType(location?.type)
    };
}

function buildCameraId(location, mode, type, data) {
    const locationKey =
        location?.id ?? `${roundCoord(location?.lat)}-${roundCoord(location?.lon)}`;

    if (type === MAP_CAMERA.BOUNDS) {
        const [west, south, east, north] = data;
        return `${locationKey}-${mode}-${roundCoord(west)},${roundCoord(south)}|${roundCoord(east)},${roundCoord(north)}`;
    }

    return `${locationKey}-${mode}-${roundCoord(data.lat)},${roundCoord(data.lon)},${data.zoom}`;
}


export function resolveMapCamera({ location, geometryBounds, searchBounds }) {
    const normalizedGeometry = normalizeBounds(geometryBounds);
    const normalizedSearch = normalizeBounds(searchBounds) ?? getSearchBoundsForLocation(location);

    //Her er magien vi legger til for å stoppe utzoomingen!
    const skipBounds = ["country", "continent", "major_landform"].includes(location?.type);

    if (normalizedGeometry && !skipBounds) {
        return {
            id: buildCameraId(location, "geometry", MAP_CAMERA.BOUNDS, normalizedGeometry),
            type: MAP_CAMERA.BOUNDS,
            data: normalizedGeometry,
            isArea: true
        };
    }

    if (normalizedSearch && !skipBounds) {
        return {
            id: buildCameraId(location, "search", MAP_CAMERA.BOUNDS, normalizedSearch),
            type: MAP_CAMERA.BOUNDS,
            data: normalizedSearch,
            isArea: isAreaLocation(location?.type)
        };
    }

    /*
    // Når skipBounds er true for Norge, tvinger vi den hit (som gir zoomnivå 4)
    const center = buildFallbackCenter(location);
    return {
        id: buildCameraId(location, "center", MAP_CAMERA.CENTER, center),
        type: MAP_CAMERA.CENTER,
        data: center,
        isArea: isAreaLocation(location?.type)
    };
    */

    const bounds = normalizedGeometry ?? normalizedSearch;
    if (bounds) {

        const zoom = estimateZoomFromBounds(bounds);

        const centerLat = (bounds[1] + bounds[3]) / 2;
        const centerLon = (bounds[0] + bounds[2]) / 2;

        const center = {
            lat: centerLat,
            lon: centerLon,
            zoom
        };

        return {
            id: buildCameraId(location, "auto", MAP_CAMERA.CENTER, center),
            type: MAP_CAMERA.CENTER,
            data: center,
            isArea: true
        };
    }

    const center = buildFallbackCenter(location);

    return {
        id: buildCameraId(location, "center", MAP_CAMERA.CENTER, center),
        type: MAP_CAMERA.CENTER,
        data: center,
        isArea: isAreaLocation(location?.type)
    };
}

/*
export function resolveMapCamera({ location, geometryBounds, searchBounds }) {
    const normalizedGeometry = normalizeBounds(geometryBounds);
    const normalizedSearch = normalizeBounds(searchBounds) ?? getSearchBoundsForLocation(location);

    if (normalizedGeometry) {
        return {
            id: buildCameraId(location, "geometry", MAP_CAMERA.BOUNDS, normalizedGeometry),
            type: MAP_CAMERA.BOUNDS,
            data: normalizedGeometry,
            isArea: true
        };
    }

    if (normalizedSearch) {
        return {
            id: buildCameraId(location, "search", MAP_CAMERA.BOUNDS, normalizedSearch),
            type: MAP_CAMERA.BOUNDS,
            data: normalizedSearch,
            isArea: isAreaLocation(location?.type)
        };
    }

    const center = buildFallbackCenter(location);

    return {
        id: buildCameraId(location, "center", MAP_CAMERA.CENTER, center),
        type: MAP_CAMERA.CENTER,
        data: center,
        isArea: isAreaLocation(location?.type)
    };
}
*/