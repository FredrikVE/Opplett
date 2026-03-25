// src/ui/utils/MapUtils/Icons/DistributeWeatherPoints.js
//
// Fordeler værpunkter jevnt utover kartet.
//
// Tre kilder, i prioritert rekkefølge:
//   1. Hardkodede storbyer (for land i MajorCities.js)
//   2. MarkerLayout-byer (fra kartets label-lag)
//   3. Grid-punkter (siste fallback for ukjente land på lav zoom)
//
// Avstandsfiltrering sikrer jevn fordeling.

import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";
import { MAP_MARKER_DISTRIBUTION } from "../Constants/MapConstants.js";
import { getMajorCities } from "./MajorCities.js";

// ─── Konfigurasjoner ────────────────────────────────────

const LOW_ZOOM_THRESHOLD = 3;
const GRID_STEPS = [0.2, 0.4, 0.6, 0.8];
const GRID_JITTER = 0.08;

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

// ─── Punkt-konvertering ──────────────────────────────────

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

// ─── Grid-generering ────────────────────────────────────

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

// ─── Filtrering ─────────────────────────────────────────

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

// ─── Kandidat-bygger ────────────────────────────────────

function buildCandidates(markerPoints, countryCode, zoom, viewportBounds) {
	// 1. Hardkodede storbyer — brukes ALLTID når de finnes
	const majorCities = getMajorCities(countryCode);

	if (majorCities.length > 0) {
		const cityPoints = majorCities.map(cityToPoint);
		return [...cityPoints, ...markerPoints];
	}

	// 2. Lav zoom uten hardkodede byer → grid som fallback
	if (zoom < LOW_ZOOM_THRESHOLD) {
		const gridPoints = generateGridPoints(viewportBounds);
		return [...markerPoints, ...gridPoints];
	}

	// 3. Normal zoom → kun MarkerLayout-byer
	return markerPoints;
}

// ─── Hovedfunksjon ──────────────────────────────────────

/**
 * @param {Array} abstractMarkers - Fra MarkerLayout.update()
 * @param {number} zoom - Nåværende zoom-nivå
 * @param {Array|null} viewportBounds - [[west,south],[east,north]]
 * @param {string|null} countryCode - ISO alpha-2 for aktivt land
 * @returns {Array<{ id, name, lat, lon }>}
 */
export function distributeWeatherPoints(abstractMarkers, zoom, viewportBounds, countryCode) {
	const maxMarkers = getMaxMarkers(zoom);
	const minDistance = getMinDistance(zoom);

	// Konverter MarkerLayout-byer til punkter
	const markerPoints = (abstractMarkers ?? [])
		.map(markerToPoint)
		.filter(Boolean)
		.sort((a, b) => a._priority - b._priority);

	const candidates = buildCandidates(markerPoints, countryCode, zoom, viewportBounds);

	if (!candidates.length) return [];

	return filterByDistance(candidates, maxMarkers, minDistance);
}