// src/ui/utils/MapUtils/Camera/CameraPolicy.js
//
// ENESTE kilde til sannhet for kamera-posisjon ved lokasjonsbytte.
// Returnerer alltid { id, lat, lon, zoom } — useMapCamera bruker kun flyTo.
//
// Strategi:
//   1. Har vi geometryBounds (fra highlight)? → senter + zoom fra den
//      (dette gir korrekt sentrering for land fordi geometrien
//       prioriterer største landmasse, f.eks. fastlands-Norge)
//   2. Område med søke-bounds? → senter + zoom fra bounds
//   3. Fallback → geocoder-koordinat + type-basert zoom

import { MAP_ZOOM_LEVELS, MAP_ZOOM_LIMITS } from "../Constants/MapConstants.js";

function clampZoom(zoom) {
	return Math.min(Math.max(zoom, MAP_ZOOM_LIMITS.MIN), MAP_ZOOM_LIMITS.MAX);
}

/**
 * Estimerer zoom fra bounds-størrelse [west, south, east, north].
 * Bruker gjennomsnittet av lat- og lon-differanse for å håndtere
 * langstrakte land (Sverige, Chile) bedre enn bare max.
 */
function zoomFromBounds(bounds) {
	const [west, south, east, north] = bounds;
	const latDiff = Math.abs(north - south);
	const lonDiff = Math.abs(east - west);
	const avgDiff = (latDiff + lonDiff) / 2;

	if (avgDiff > 50) return 2;
	if (avgDiff > 25) return 3;
	if (avgDiff > 12) return 4;
	if (avgDiff > 6) return 5;
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
function zoomFromType(type) {
	switch (type) {
		case "continental_marine":
		case "major_landform":
			return 3;
		case "country":
			return 4;
		case "region":
			return 6;
		case "subregion":
		case "county":
			return 8;
		case "municipality":
		case "place":
			return 10;
		case "neighbourhood":
		case "address":
			return 13;
		default:
			return MAP_ZOOM_LEVELS.DEFAULT; // 14 (GPS)
	}
}

/**
 * Normaliserer bounds til [west, south, east, north].
 */
function normalizeBounds(bounds) {
	if (!bounds) return null;

	// [west, south, east, north]
	if (Array.isArray(bounds) && bounds.length === 4 && bounds.every(Number.isFinite)) {
		return bounds;
	}
	// [[west, south], [east, north]]
	if (Array.isArray(bounds) && bounds.length === 2 && Array.isArray(bounds[0])) {
		return [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
	}
	// { southwest: { lng, lat }, northeast: { lng, lat } }
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

const SKIP_SEARCH_BOUNDS = ["country", "continental_marine", "major_landform"];

/**
 * @param {{ location, geometryBounds? }} params
 *   - location: activeLocation-objektet
 *   - geometryBounds: bounds fra highlight-geometri (valgfritt, fra getBoundsFromGeometry)
 * @returns {{ id, lat, lon, zoom } | null}
 */
export function resolveMapCamera({ location, geometryBounds }) {
	if (location?.lat == null || location?.lon == null) {
		return null;
	}

	// 1. Geometri-bounds (fra highlight) → best mulig for land
	//    Prioriterer største landmasse, unngår Svalbard/Bouvetøya
	const geoBounds = normalizeBounds(geometryBounds);
	if (geoBounds) {
		const { lat, lon } = centerFromBounds(geoBounds);
		return {
			id: `${location.id ?? "gps"}-geo-${geoBounds.join(",")}`,
			lat, lon,
			zoom: clampZoom(zoomFromBounds(geoBounds)),
		};
	}

	// 2. Søke-bounds (fra geocoder) — men ikke for land/kontinenter
	//    (deres bounds inkluderer fjerne territorier)
	const searchBounds = normalizeBounds(location.bounds);
	if (searchBounds && !SKIP_SEARCH_BOUNDS.includes(location.type)) {
		const { lat, lon } = centerFromBounds(searchBounds);
		return {
			id: `${location.id ?? "gps"}-search-${searchBounds.join(",")}`,
			lat, lon,
			zoom: clampZoom(zoomFromBounds(searchBounds)),
		};
	}

	// 3. Fallback → geocoder-koordinat + type-basert zoom
	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}`,
		lat: location.lat,
		lon: location.lon,
		zoom: clampZoom(zoomFromType(location.type)),
	};
}