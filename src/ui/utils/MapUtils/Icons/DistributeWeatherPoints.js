// src/ui/utils/MapUtils/Icons/DistributeWeatherPoints.js
//
// Fordeler værpunkter jevnt utover kartet.
//
// Hybridstrategi:
//   Zoom >= 3  →  Kun MarkerLayout-byer
//   Zoom < 3   →  Hardkodede storbyer (RU, CA, US, CN, BR, AU, IN, AR)
//                  + MarkerLayout-byer som supplement
//                  + Grid-punkter som siste fallback

import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";
import { MAP_MARKER_DISTRIBUTION } from "../Constants/MapConstants.js";
import { getMajorCities } from "./MajorCities.js";

// ─── Avstandsberegning ────────────────────────────────────

function getMinDistance(zoom) {
	const d = MAP_MARKER_DISTRIBUTION;

	if (zoom <= d.LOW_ZOOM_THRESHOLD) {
		return Math.max(
			(d.BASE_DISTANCE_DEGREES / Math.pow(2, zoom)) * d.LOW_ZOOM_DISTANCE_MULTIPLIER,
			d.LOW_ZOOM_MIN_DISTANCE_CAP
		);
	}

	return Math.min(
		Math.max(d.BASE_DISTANCE_DEGREES / Math.pow(2, zoom), d.MIN_DISTANCE_CAP_DEGREES),
		d.MAX_DISTANCE_CAP_DEGREES
	);
}

function getMaxMarkers(zoom) {
	const { ZOOM_BREAKPOINTS, MARKER_LIMITS } = MAP_MARKER_DISTRIBUTION;

	if (zoom <= ZOOM_BREAKPOINTS.FAR) return MARKER_LIMITS.FAR;
	if (zoom <= ZOOM_BREAKPOINTS.MID) return MARKER_LIMITS.MID;
	return MARKER_LIMITS.DEFAULT;
}

// ─── Konvertering ─────────────────────────────────────────

function toPoint(marker) {
	const feature = marker.features?.[0];
	const coords = feature?.geometry?.coordinates;
	if (!coords) return null;

	const [lon, lat] = coords;
	const props = feature.properties ?? {};

	return {
		id: feature.id ?? `${lat.toFixed(4)}:${lon.toFixed(4)}`,
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
		_priority: index, // Hovedsteder først (de ligger først i listen)
	};
}

// ─── Grid-generering (fallback for ukjente store land) ───

const GRID_STEPS = [0.2, 0.4, 0.6, 0.8];
const JITTER = 0.08;

function generateGridPoints(bounds) {
	if (!bounds) return [];

	const [[west, south], [east, north]] = bounds;
	const latSpan = north - south;
	const lonSpan = east - west;
	const points = [];

	for (const latStep of GRID_STEPS) {
		for (const lonStep of GRID_STEPS) {
			const jitterLat = (Math.random() - 0.5) * JITTER * latSpan;
			const jitterLon = (Math.random() - 0.5) * JITTER * lonSpan;

			const lat = Math.max(-85, Math.min(85, south + latSpan * latStep + jitterLat));
			const lon = west + lonSpan * lonStep + jitterLon;

			points.push({
				id: `grid-${latStep}-${lonStep}`,
				name: "",
				lat,
				lon: ((lon + 180) % 360 + 360) % 360 - 180,
				_priority: 100,
			});
		}
	}

	return points;
}

// ─── Grådig avstandsfiltrering ────────────────────────────

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

// ─── Hovedfunksjon ────────────────────────────────────────

const LOW_ZOOM_THRESHOLD = 3;

/**
 * @param {Array} abstractMarkers - Fra MarkerLayout.update()
 * @param {number} zoom - Nåværende zoom-nivå
 * @param {Object|null} highlightGeometry - Reservert (ikke brukt)
 * @param {Array|null} viewportBounds - [[west,south],[east,north]]
 * @param {string|null} countryCode - ISO alpha-2 for aktivt land (f.eks. "RU")
 * @returns {Array<{ id, name, lat, lon }>}
 */
export function distributeWeatherPoints(
	abstractMarkers,
	zoom,
	highlightGeometry,
	viewportBounds,
	countryCode
) {
	const maxMarkers = getMaxMarkers(zoom);
	const minDistance = getMinDistance(zoom);

	// 1. Konverter MarkerLayout-byer til punkter
	const markerPoints = [];
	for (const marker of abstractMarkers ?? []) {
		const point = toPoint(marker);
		if (point) markerPoints.push(point);
	}
	markerPoints.sort((a, b) => a._priority - b._priority);

	// 2. Hardkodede storbyer for land som har dem
	//    Brukes ALLTID ved land-søk (countryCode finnes) — ikke bare lav zoom.
	//    Sikrer at Oslo, Helsinki, Stockholm etc. alltid vises.
	//    På lav zoom uten hardkodede byer: grid som fallback.
	const majorCities = getMajorCities(countryCode);
	let candidates;

	if (majorCities.length > 0) {
		// Hardkodede byer først (prioritet 0+), deretter MarkerLayout som supplement
		const cityPoints = majorCities.map(cityToPoint);
		candidates = [...cityPoints, ...markerPoints];
	} else if (zoom < LOW_ZOOM_THRESHOLD) {
		// Ingen hardkodede byer + lav zoom → grid som fallback
		const gridPoints = generateGridPoints(viewportBounds);
		candidates = [...markerPoints, ...gridPoints];
	} else {
		candidates = markerPoints;
	}

	if (!candidates.length) return [];

	// 3. Grådig filtrering — behold punkter som ikke overlapper
	return filterByDistance(candidates, maxMarkers, minDistance);
}