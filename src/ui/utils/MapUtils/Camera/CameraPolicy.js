//src/ui/utils/MapUtils/Camera/CameraPolicy.js
const ZOOM_LIMITS = {
	MIN: 1,
	MAX: 14,
};

const DEFAULT_ZOOM = 14;
const STREET_ZOOM = 12;

const TYPE_ZOOM = {
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

const AWAIT_GEOMETRY_TYPES = new Set([
	"country",
	"continental_marine",
	"major_landform"
]);

const ZOOM_THRESHOLDS = [
	{ maxDegrees: 50, zoom: 2 },
	{ maxDegrees: 25, zoom: 3 },
	{ maxDegrees: 10, zoom: 4 },
	{ maxDegrees: 5, zoom: 5 },
	{ maxDegrees: 3, zoom: 6 },
	{ maxDegrees: 1.5, zoom: 7 },
	{ maxDegrees: 0.8, zoom: 8 },
	{ maxDegrees: 0.4, zoom: 9 },
	{ maxDegrees: 0.15, zoom: 10 },
];

/* =========================
	HELPERS
========================= */
function clampZoom(zoom) {
	return Math.min(
		Math.max(zoom, ZOOM_LIMITS.MIN),
		ZOOM_LIMITS.MAX
	);
}

function zoomFromBounds(bounds) {
	const [west, south, east, north] = bounds;

	const latDiff = Math.abs(north - south);
	const lonDiff = Math.abs(east - west);
	const avgDiff = (latDiff + lonDiff) / 2;

	if (avgDiff <= 0) {
		return DEFAULT_ZOOM;
	}

	for (const { maxDegrees: maxDiff, zoom } of ZOOM_THRESHOLDS) {
		if (avgDiff > maxDiff) {
			return zoom;
		}
	}

	return STREET_ZOOM;
}

function zoomFromType(type) {
	return TYPE_ZOOM[type] ?? DEFAULT_ZOOM;
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

	// GEOMETRY
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

	// SEARCH
	const searchBounds = normalizeBounds(location.bounds);

	if (searchBounds && !AWAIT_GEOMETRY_TYPES.has(location.type)) {
		const { lat, lon } = centerFromBounds(searchBounds);

		return {
			id: `${location.id ?? "gps"}-search-${searchBounds.join(",")}`,
			lat,
			lon,
			zoom: clampZoom(zoomFromBounds(searchBounds)),
		};
	}

	// WAIT FOR GEOMETRY
	if (AWAIT_GEOMETRY_TYPES.has(location.type) && location.id) {
		return null;
	}

	// FALLBACK
	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}`,
		lat: location.lat,
		lon: location.lon,
		zoom: clampZoom(zoomFromType(location.type)),
	};
}