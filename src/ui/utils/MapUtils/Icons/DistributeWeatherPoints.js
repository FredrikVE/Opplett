import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";
import { getMajorCities } from "./MajorCities.js";
import { ZOOM_LEVELS } from "../Zoom/ZoomConfig.js";

/* =========================
    CONFIG
========================= */
const GRID_STEPS = [0.2, 0.4, 0.6, 0.8];
const GRID_JITTER = 0.08;

const DISTRIBUTION = {
    baseDistance: 45,
    maxDistance: 3,
    minDistance: 0.01,
};

const GRID_FALLBACK = {
    maxMarkerPoints: 2,
    minZoom: ZOOM_LEVELS.NEIGHBOURHOOD,
};

/* =========================
    ZOOM RULES
========================= */
function getMinDistance(zoom) {
    return Math.min(
        Math.max(DISTRIBUTION.baseDistance / Math.pow(2, zoom), DISTRIBUTION.minDistance),
        DISTRIBUTION.maxDistance
    );
}

function getMaxMarkers(zoom) {
    if (zoom <= 3) return 12;
    if (zoom <= 6) return 18;
    return 25;
}

/* =========================
    POINT CONVERSION
========================= */
function markerToPoint(marker) {
    const feature = marker.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!coords) return null;

    const [lon, lat] = coords;
    const props = feature.properties ?? {};

    return {
        id: feature.id ?? `${lat.toFixed(6)}:${lon.toFixed(6)}`,
        name: props.name || props.name_en || "Ukjent sted",
        lat,
        lon,
        _priority: getFeaturePriorityScore(feature),
    };
}

function cityToPoint(city, index) {
    return {
        id: `major-${city.name}-${index}`,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        _priority: index,
    };
}

/* =========================
    GRID GENERATION
========================= */
function generateGridPoints(bounds) {
    if (!bounds) return [];

    const [[west, south], [east, north]] = bounds;
    const latSpan = north - south;
    const lonSpan = east - west;

    const points = [];

    for (const latStep of GRID_STEPS) {
        for (const lonStep of GRID_STEPS) {
            const jitterLat = (Math.random() - 0.5) * GRID_JITTER * latSpan;
            const jitterLon = (Math.random() - 0.5) * GRID_JITTER * lonSpan;

            points.push({
                id: `grid-${latStep}-${lonStep}`,
                name: "",
                lat: Math.max(-85, Math.min(85, south + latSpan * latStep + jitterLat)),
                lon: ((west + lonSpan * lonStep + jitterLon + 180) % 360 + 360) % 360 - 180,
                _priority: 100,
            });
        }
    }

    return points;
}

/* =========================
    GRID FALLBACK CHECK
========================= */
function needsGridFallback(markerCount, zoom) {
    return markerCount <= GRID_FALLBACK.maxMarkerPoints
        && zoom > GRID_FALLBACK.minZoom;
}

/* =========================
    FILTERING
========================= */
function filterByDistance(candidates, maxMarkers, minDistance) {
    const result = [];

    for (const point of candidates) {
        if (result.length >= maxMarkers) break;

        const tooClose = result.some(
            (kept) =>
                Math.abs(kept.lon - point.lon) < minDistance &&
                Math.abs(kept.lat - point.lat) < minDistance
        );

        if (!tooClose) {
            result.push(point);
        }
    }

    return result;
}

/* =========================
    CANDIDATE BUILDING
========================= */
function isWithinBounds(point, bounds) {
    if (!bounds) return true;

    const [[west, south], [east, north]] = bounds;

    return point.lat >= south
        && point.lat <= north
        && point.lon >= west
        && point.lon <= east;
}

function buildCandidates(markerPoints, countryCode, zoom, bounds) {
    const majorCities = getMajorCities(countryCode);

    if (majorCities.length > 0) {
        const visibleCities = majorCities
            .map(cityToPoint)
            .filter(city => isWithinBounds(city, bounds));

        return [...visibleCities, ...markerPoints];
    }

    if (needsGridFallback(markerPoints.length, zoom)) {
        return [...markerPoints, ...generateGridPoints(bounds)];
    }

    return markerPoints;
}

/* =========================
    PUBLIC API
========================= */
export function distributeWeatherPoints(abstractMarkers, zoom, viewportBounds, countryCode) {
    const maxMarkers = getMaxMarkers(zoom);
    const minDistance = getMinDistance(zoom);

    const markerPoints = (abstractMarkers ?? [])
        .map(markerToPoint)
        .filter(Boolean)
        .sort((a, b) => a._priority - b._priority);

    const candidates = buildCandidates(
        markerPoints,
        countryCode,
        zoom,
        viewportBounds
    );

    if (!candidates.length) {
		return [];
	}

    return filterByDistance(candidates, maxMarkers, minDistance);
}