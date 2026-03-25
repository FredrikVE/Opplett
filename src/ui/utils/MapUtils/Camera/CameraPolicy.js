//src/ui/utils/MapUtils/Camera/CameraPolicy.js
import { MAP_ZOOM_LEVELS, MAP_ZOOM_LIMITS } from "../Constants/MapConstants.js";

/* =========================
	CONSTANTS
========================= */
const AWAIT_GEOMETRY_TYPES = [
	"country",
	"continental_marine",
	"major_landform"
];

const TYPE_ZOOM_MAP = {
	continental_marine: 3,
	major_landform: 3,
	country: 4,
	region: 6,
	subregion: 8,
	county: 8,
	municipality: 10,
	place: 10,
	neighbourhood: 13,
	address: 13,
};

const ZOOM_THRESHOLDS = [
	{ maxDiff: 50, zoom: 2 },
	{ maxDiff: 25, zoom: 3 },
	{ maxDiff: 10, zoom: 4 },
	{ maxDiff: 5, zoom: 5 },
	{ maxDiff: 3, zoom: 6 },
	{ maxDiff: 1.5, zoom: 7 },
	{ maxDiff: 0.8, zoom: 8 },
	{ maxDiff: 0.4, zoom: 9 },
	{ maxDiff: 0.15, zoom: 10 },
];

/* =========================
	HELPERS
========================= */
function clampZoom(zoom) {
	return Math.min(
		Math.max(zoom, MAP_ZOOM_LIMITS.MIN),
		MAP_ZOOM_LIMITS.MAX
	);
}

function zoomFromBounds(bounds) {
	const [west, south, east, north] = bounds;

	const latDiff = Math.abs(north - south);
	const lonDiff = Math.abs(east - west);
	const avgDiff = (latDiff + lonDiff) / 2;

	if (avgDiff <= 0) {
		return MAP_ZOOM_LEVELS.DEFAULT;
	}

	for (const { maxDiff, zoom } of ZOOM_THRESHOLDS) {
		if (avgDiff > maxDiff) {
			return zoom;
		}
	}

	return MAP_ZOOM_LEVELS.STREET;	// Street er 12
}

function zoomFromType(type) {
	return TYPE_ZOOM_MAP[type] ?? MAP_ZOOM_LEVELS.DEFAULT;
}

/* =========================
	BOUNDS UTILS
========================= */
function normalizeBounds(bounds) {
	if (!bounds) return null;

	if (Array.isArray(bounds)) {
		if (bounds.length === 4 && bounds.every(Number.isFinite)) {
			return bounds;
		}

		if (bounds.length === 2 && Array.isArray(bounds[0])) {
			return [
				bounds[0][0],
				bounds[0][1],
				bounds[1][0],
				bounds[1][1]
			];
		}
	}

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

function centerFromBounds(bounds) {
	return {
		lat: (bounds[1] + bounds[3]) / 2,
		lon: (bounds[0] + bounds[2]) / 2,
	};
}

/* =========================
	PUBLIC API
========================= */
export function resolveMapCamera({ location, geometryBounds }) {
	if (location?.lat == null || location?.lon == null) {
		return null;
	}

	//GEOMETRY
	const geoBounds = normalizeBounds(geometryBounds);

	if (geoBounds) {
		const { lat, lon } = centerFromBounds(geoBounds);

		return {
			id: `${location.id ?? "gps"}-geo-${geoBounds.join(",")}`,
			lat,
			lon,
			zoom: clampZoom(zoomFromBounds(geoBounds)),
		};
	}

	//SEARCH
	const searchBounds = normalizeBounds(location.bounds);

	if (searchBounds && !AWAIT_GEOMETRY_TYPES.includes(location.type)) {
		const { lat, lon } = centerFromBounds(searchBounds);

		return {
			id: `${location.id ?? "gps"}-search-${searchBounds.join(",")}`,
			lat,
			lon,
			zoom: clampZoom(zoomFromBounds(searchBounds)),
		};
	}

	//WAIT 
	if (AWAIT_GEOMETRY_TYPES.includes(location.type) && location.id) {
		return null;
	}

	//FALLBACK
	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}`,
		lat: location.lat,
		lon: location.lon,
		zoom: clampZoom(zoomFromType(location.type)),
	};
}