//src/ui/utils/MapUtils/MapCamera.js
import { MAP_CAMERA, isAreaLocation, shouldUseSearchBounds, getDefaultZoomForLocationType } from "./MapConfig.js";

const roundCoord = (value) => Number(value ?? 0).toFixed(4);

export function normalizeBounds(bounds) {
    if (!bounds) return null;

    // [west, south, east, north]
    if (
        Array.isArray(bounds) &&
        bounds.length === 4 &&
        bounds.every((v) => typeof v === "number")
    ) {
        return bounds;
    }

    // [[west, south], [east, north]]
    if (
        Array.isArray(bounds) &&
        bounds.length === 2 &&
        Array.isArray(bounds[0]) &&
        Array.isArray(bounds[1])
    ) {
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
    if (!bounds) return null;
    if (!shouldUseSearchBounds(location?.type)) return null;
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
    const normalizedSearch =
        normalizeBounds(searchBounds) ?? getSearchBoundsForLocation(location);

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