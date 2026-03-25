// src/ui/utils/MapUtils/Camera/CameraPolicy.js
//
// ENESTE kilde til sannhet for kamera-posisjon ved lokasjonsbytte.
// Returnerer alltid { id, lat, lon, zoom } — useMapCamera bruker kun flyTo.
//
// Strategi:
//   1. Geometri-bounds (fra highlight) → senter + zoom
//   2. Søke-bounds (fra geocoder) → senter + zoom (ikke for land)
//   3. Land/kontinent uten geometri → null (vent på geometri)
//   4. Fallback → geocoder-koordinat + type-basert zoom

import { MAP_ZOOM_LEVELS, MAP_ZOOM_LIMITS } from "../Constants/MapConstants.js";

function clampZoom(zoom) {
	return Math.min(Math.max(zoom, MAP_ZOOM_LIMITS.MIN), MAP_ZOOM_LIMITS.MAX);
}

/**
 * Estimerer zoom-nivå fra bounds-størrelse.
 * Bruker en logaritmisk formel i stedet for hardkodede terskler.
 *
 * Logikken: ved zoom 0 vises ~360° av jorden.
 * For hvert zoom-nivå halveres synlig område.
 * Formelen inverterer dette: zoom ≈ log2(360 / avgDiff)
 *
 * Offset og faktor er justert empirisk for å gi naturlige resultater:
 *   Russland (avgDiff ~87) → ~2     Norge (avgDiff ~18) → ~4
 *   Tyskland (avgDiff ~8)  → ~5     Danmark (avgDiff ~3) → ~7
 */


function zoomFromBounds(bounds) {
	const [west, south, east, north] = bounds;

	const latDiff = Math.abs(north - south);
	const lonDiff = Math.abs(east - west);
	const avgDiff = (latDiff + lonDiff) / 2;

	if (avgDiff <= 0) {
		return MAP_ZOOM_LEVELS.DEFAULT;
	}

	if (avgDiff > 50) return 2;
	if (avgDiff > 25) return 3;
	if (avgDiff > 10) return 4;
	if (avgDiff > 5) return 5;
	if (avgDiff > 3) return 6;
	if (avgDiff > 1.5) return 7;
	if (avgDiff > 0.8) return 8;
	if (avgDiff > 0.4) return 9;
	if (avgDiff > 0.15) return 10;

	return 12;
}

/**
 * Type → zoom (fallback når bounds ikke finnes).
 */
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

function zoomFromType(type) {
	return TYPE_ZOOM_MAP[type] ?? MAP_ZOOM_LEVELS.DEFAULT;
}

/**
 * Normaliserer bounds til [west, south, east, north].
 * Godtar tre formater:
 *   - [west, south, east, north]
 *   - [[west, south], [east, north]]
 *   - { southwest: { lng, lat }, northeast: { lng, lat } }
 */
function normalizeBounds(bounds) {
	if (!bounds) return null;

	if (Array.isArray(bounds)) {
		if (bounds.length === 4 && bounds.every(Number.isFinite)) {
			return bounds;
		}
		if (bounds.length === 2 && Array.isArray(bounds[0])) {
			return [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
		}
	}

	if (bounds?.southwest && bounds?.northeast) {
		return [bounds.southwest.lng, bounds.southwest.lat, bounds.northeast.lng, bounds.northeast.lat];
	}

	return null;
}

function centerFromBounds(bounds) {
	return {
		lat: (bounds[1] + bounds[3]) / 2,
		lon: (bounds[0] + bounds[2]) / 2,
	};
}

// Land og kontinenter: bruk geometri-bounds, ikke søke-bounds
// (søke-bounds inkluderer fjerne territorier som Svalbard, Hawaii)
const AWAIT_GEOMETRY_TYPES = ["country", "continental_marine", "major_landform"];

/**
 * @param {{ location, geometryBounds? }} params
 * @returns {{ id, lat, lon, zoom } | null}
 */
export function resolveMapCamera({ location, geometryBounds }) {
	if (location?.lat == null || location?.lon == null) {
		return null;
	}

	// 1. Geometri-bounds → best mulig sentrering
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

	// 2. Søke-bounds — men ikke for typer som venter på geometri
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

	// 3. Land/kontinent uten geometri: returner null → useMapCamera venter
	if (AWAIT_GEOMETRY_TYPES.includes(location.type) && location.id) {
		return null;
	}

	// 4. Fallback → geocoder-koordinat + type-basert zoom
	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}`,
		lat: location.lat,
		lon: location.lon,
		zoom: clampZoom(zoomFromType(location.type)),
	};
}