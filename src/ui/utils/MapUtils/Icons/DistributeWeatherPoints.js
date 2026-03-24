// src/ui/utils/MapUtils/Icons/DistributeWeatherPoints.js
import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";
import { MAP_MARKER_DISTRIBUTION } from "../Constants/MapConstants.js";

/**
 * Beregner minimumsavstand mellom markører basert på zoom-nivå.
 * Lav zoom = stor avstand (færre markører), høy zoom = liten avstand (flere).
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
		Math.max(
			d.BASE_DISTANCE_DEGREES / Math.pow(2, zoom), 
			d.MIN_DISTANCE_CAP_DEGREES
		),

		d.MAX_DISTANCE_CAP_DEGREES
	);
}

/**
 * Bestemmer maks antall markører basert på zoom-nivå.
 */
function getMaxMarkers(zoom) {
	const { ZOOM_BREAKPOINTS, MARKER_LIMITS } = MAP_MARKER_DISTRIBUTION;

	if (zoom <= ZOOM_BREAKPOINTS.FAR) {
		return MARKER_LIMITS.FAR;
	}

	if (zoom <= ZOOM_BREAKPOINTS.MID) {
		return MARKER_LIMITS.MID;
	}

	return MARKER_LIMITS.DEFAULT;
}

/**
 * Tar inn abstract markers fra MarkerLayout, sorterer etter prioritet,
 * og returnerer en jevnt fordelt liste med punkter for værhenting.
 *
 * @param {Array} abstractMarkers - Fra MarkerLayout.update()
 * @param {number} zoom - Nåværende zoom-nivå
 * @returns {Array<{ id, name, lat, lon }>}
 */
export function distributeWeatherPoints(abstractMarkers, zoom) {
	if (!abstractMarkers?.length) {
		return [];
	}

	const maxMarkers = getMaxMarkers(zoom);
	const minDistance = getMinDistance(zoom);

	// Sortér: viktigste byer først
	const sorted = [...abstractMarkers].sort((a, b) => {
		return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
	});

	// Grådig filtrering: behold punkter som ikke er for nære hverandre
	const result = [];

	for (const marker of sorted) {
		if (result.length >= maxMarkers) {
			break;
		}

		const feature = marker.features?.[0];
		const coords = feature?.geometry?.coordinates;
		if (!coords) {
			continue;
		}

		const [lon, lat] = coords;
		const props = feature.properties ?? {};

		const tooClose = result.some(
			(kept) =>
				Math.abs(kept.lon - lon) < minDistance &&
				Math.abs(kept.lat - lat) < minDistance
		);

		if (!tooClose) {
			result.push({
				id: feature.id ?? `${lat.toFixed(4)}:${lon.toFixed(4)}`,
				name: props.name || props.name_en || "Ukjent sted",
				lat,
				lon,
			});
		}
	}

	return result;
}
