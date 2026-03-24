// src/ui/utils/MapUtils/Camera/CameraPolicy.js
import { MAP_ZOOM_LIMITS, MAP_ZOOM_LEVELS } from "../Constants/MapConstants.js";

/**
 * Mapper lokasjonstype til zoom-nivå.
 * Dette er den ENESTE stedet zoom bestemmes fra type.
 */
function getZoomForType(type) {
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
			return 12;

		default:
			//return 10;
			return MAP_ZOOM_LEVELS.DEFAULT;

	}
}

function clampZoom(zoom) {
	return Math.min(Math.max(zoom, MAP_ZOOM_LIMITS.MIN), MAP_ZOOM_LIMITS.MAX);
}

/**
 * Returnerer et kamera-target basert på aktiv lokasjon.
 *
 * @param {{ location: { lat, lon, id, type } }} params
 * @returns {{ id: string, lat: number, lon: number, zoom: number } | null}
 */
export function resolveMapCamera({ location }) {
	if (location?.lat == null || location?.lon == null) {
		return null;
	}

	const zoom = clampZoom(getZoomForType(location.type));

	return {
		id: `${location.id ?? "gps"}-${location.type ?? "default"}-${zoom}`,
		lat: location.lat,
		lon: location.lon,
		zoom,
	};
}
