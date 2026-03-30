//src/ui/utils/MapUtils/Camera/CameraPolicy.js
import { ZOOM_LEVELS, MIN_ZOOM, MAX_ZOOM } from "../Zoom/ZoomConfig";

const DEFAULT_ZOOM = ZOOM_LEVELS.STREET;

const TYPE_ZOOM = {
	continental_marine: ZOOM_LEVELS.CONTINENT,	//3
	major_landform: ZOOM_LEVELS.CONTINENT,		//3
	country: ZOOM_LEVELS.COUNTRY,				//4
	region: ZOOM_LEVELS.REGION,					//6
	subregion: ZOOM_LEVELS.SUBREGION,			//7
	county: ZOOM_LEVELS.COUNTY,					//8
	municipality: ZOOM_LEVELS.MUNICIPALITY,		//10	
	place: ZOOM_LEVELS.MUNICIPALITY,			//10
	neighbourhood: ZOOM_LEVELS.NEIGHBOURHOOD,	//12
	address: ZOOM_LEVELS.STREET,				//14
};

const AWAIT_GEOMETRY_TYPES = new Set([
	"country",
	"continental_marine",
	"major_landform"
]);

const ZOOM_THRESHOLDS = [
	{ maxDegrees: 50, zoom: ZOOM_LEVELS.MAJOR_LANDFORM },	//2
	{ maxDegrees: 25, zoom: ZOOM_LEVELS.CONTINENT },		//3
	{ maxDegrees: 10, zoom: ZOOM_LEVELS.COUNTRY },			//4
	{ maxDegrees: 5, zoom: ZOOM_LEVELS.SMALL_COUNTRY },		//5
	{ maxDegrees: 3, zoom: ZOOM_LEVELS.REGION },			//6
	{ maxDegrees: 1.5, zoom: ZOOM_LEVELS.SUBREGION },		//7
	{ maxDegrees: 0.8, zoom: ZOOM_LEVELS.COUNTY },			//8
	{ maxDegrees: 0.4, zoom: ZOOM_LEVELS.LOCAL_REGION },	//9
	{ maxDegrees: 0.15, zoom: ZOOM_LEVELS.MUNICIPALITY },	//10
];

/* =========================
	HELPERS
========================= */
function clampZoom(zoom) {
	return Math.min(
		Math.max(zoom, MIN_ZOOM),
		MAX_ZOOM
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

	return ZOOM_LEVELS.STREET;
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

	//GEOMETRY – mest presist, brukes når geometri er ferdig lastet
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

	//SEARCH BOUNDS – brukes for typer som IKKE venter på geometri
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

	//AWAITING GEOMETRY – midlertidig kamera mens geometri lastes
	//Bruker searchBounds som foreløpig utsnitt i stedet for å returnere null
	if (AWAIT_GEOMETRY_TYPES.has(location.type) && location.id) {
		if (searchBounds) {
			const { lat, lon } = centerFromBounds(searchBounds);

			return {
				id: `${location.id}-awaiting-geo`,
				lat,
				lon,
				zoom: clampZoom(zoomFromBounds(searchBounds)),
			};
		}

		// Fallback hvis searchBounds heller ikke finnes
		return {
			id: `${location.id}-awaiting-geo-fallback`,
			lat: location.lat,
			lon: location.lon,
			zoom: clampZoom(zoomFromType(location.type)),
		};
	}

	//FALLBACK – punkt-lokasjoner uten bounds
	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}`,
		lat: location.lat,
		lon: location.lon,
		zoom: clampZoom(zoomFromType(location.type)),
	};
}