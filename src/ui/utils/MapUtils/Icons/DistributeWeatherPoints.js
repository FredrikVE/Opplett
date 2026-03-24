// src/ui/utils/MapUtils/Icons/DistributeWeatherPoints.js
//
// Filtrerer og fordeler værpunkter slik at de ikke overlapper.
//
// Prioritering:
//   1. Byer INNENFOR highlight-geometri (det valgte landet/området) først
//   2. Deretter byer utenfor, sortert etter global viktighet
//
// Dette sikrer at Helsinki vises før Tallinn når man søker på Finland.

import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";
import { MAP_MARKER_DISTRIBUTION } from "../Constants/MapConstants.js";
import { isPointInGeometry } from "../Camera/MapBoundsHelper.js";

/**
 * Beregner minimumsavstand mellom markører basert på zoom-nivå.
 */
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

/**
 * Bestemmer maks antall markører basert på zoom-nivå.
 */
function getMaxMarkers(zoom) {
	const { ZOOM_BREAKPOINTS, MARKER_LIMITS } = MAP_MARKER_DISTRIBUTION;

	if (zoom <= ZOOM_BREAKPOINTS.FAR) return MARKER_LIMITS.FAR;
	if (zoom <= ZOOM_BREAKPOINTS.MID) return MARKER_LIMITS.MID;
	return MARKER_LIMITS.DEFAULT;
}

/**
 * Konverterer en abstract marker til et punkt-objekt.
 */
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

/**
 * @param {Array} abstractMarkers - Fra MarkerLayout.update()
 * @param {number} zoom - Nåværende zoom-nivå
 * @param {Object|null} highlightGeometry - GeoJSON for valgt område (valgfritt)
 * @returns {Array<{ id, name, lat, lon }>}
 */
export function distributeWeatherPoints(abstractMarkers, zoom, highlightGeometry) {
	if (!abstractMarkers?.length) {
		return [];
	}

	const maxMarkers = getMaxMarkers(zoom);
	const minDistance = getMinDistance(zoom);

	// Konverter til punkter
	const allPoints = [];
	for (const marker of abstractMarkers) {
		const point = toPoint(marker);
		if (point) allPoints.push(point);
	}

	// Hvis highlight-geometri finnes → kun byer innenfor grensene
	// Ellers → alle synlige byer
	const candidates = highlightGeometry
		? allPoints.filter((p) => isPointInGeometry(p.lon, p.lat, highlightGeometry))
		: allPoints;

	// Sortér etter prioritet (viktigste byer først)
	candidates.sort((a, b) => a._priority - b._priority);

	// Grådig filtrering: behold punkter som ikke er for nære hverandre
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