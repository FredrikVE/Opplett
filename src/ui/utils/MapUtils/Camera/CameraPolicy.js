// src/ui/utils/MapUtils/Camera/CameraPolicy.js
import { MAP_CAMERA, MAP_ZOOM_LEVELS, MAP_ZOOM_LIMITS } from "../Constants/MapConstants.js";
import { isAreaLocation, shouldUseSearchBounds, getDefaultZoomForLocationType } from "./MapLocationLogic.js";

function clampZoom(zoom) {
	return Math.min(
		Math.max(zoom, MAP_ZOOM_LIMITS.MIN),
		MAP_ZOOM_LIMITS.MAX
	);
}

function serializeCoord(value) {
	const num = Number(value);
	return Number.isFinite(num);
}

export function estimateZoomFromBounds(bounds) {
	const [west, south, east, north] = bounds;

	const latDiff = Math.abs(north - south);
	const lonDiff = Math.abs(east - west);
	const maxDiff = Math.max(latDiff, lonDiff);

	if (maxDiff > 120) return MAP_ZOOM_LEVELS.WORLD;
	if (maxDiff > 60) return MAP_ZOOM_LEVELS.WORLD_CLOSE;
	if (maxDiff > 30) return MAP_ZOOM_LEVELS.COUNTRY;
	if (maxDiff > 15) return MAP_ZOOM_LEVELS.COUNTRY_CLOSE;
	if (maxDiff > 8) return MAP_ZOOM_LEVELS.REGION_WIDE;
	if (maxDiff > 4) return MAP_ZOOM_LEVELS.REGION;
	if (maxDiff > 2) return MAP_ZOOM_LEVELS.SUB_REGION;
	if (maxDiff > 1) return MAP_ZOOM_LEVELS.COUNTY;
	if (maxDiff > 0.5) return MAP_ZOOM_LEVELS.DISTRICT;
	if (maxDiff > 0.2) return MAP_ZOOM_LEVELS.CITY;

	return MAP_ZOOM_LEVELS.STREET;
}

export function normalizeBounds(bounds) {
	if (!bounds) return null;

	if (
		Array.isArray(bounds) &&
		bounds.length === 4 &&
		bounds.every((value) => typeof value === "number")
	) {
		return bounds;
	}

	if (
		Array.isArray(bounds) &&
		bounds.length === 2 &&
		Array.isArray(bounds[0]) &&
		Array.isArray(bounds[1])
	) {
		const [[west, south], [east, north]] = bounds;
		return [west, south, east, north];
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

function getSearchBoundsForLocation(location) {
	const bounds = normalizeBounds(location?.bounds);

	if (!bounds) return null;
	if (!shouldUseSearchBounds(location?.type)) return null;

	return bounds;
}

function buildFallbackCenter(location) {
	return {
		lat: location?.lat ?? 0,
		lon: location?.lon ?? 0,
		zoom: clampZoom(getDefaultZoomForLocationType(location?.type))
	};
}

function buildCameraId(location, mode, type, data) {
	const locationKey =
		location?.id ??
		`${serializeCoord(location?.lat)}-${serializeCoord(location?.lon)}`;

	if (type === MAP_CAMERA.BOUNDS) {
		const [west, south, east, north] = data;

		return [
			locationKey,
			mode,
			`${serializeCoord(west)},${serializeCoord(south)}`,
			`${serializeCoord(east)},${serializeCoord(north)}`
		].join("|");
	}

	return [
		locationKey,
		mode,
		serializeCoord(data.lat),
		serializeCoord(data.lon),
		serializeCoord(data.zoom)
	].join("|");
}

export function resolveMapCamera({ location, geometryBounds, searchBounds }) {

	const normalizedGeometry = normalizeBounds(geometryBounds);

	const normalizedSearch =
		normalizeBounds(searchBounds) ?? getSearchBoundsForLocation(location);

	const skipBounds =
		["country", "continent", "major_landform"].includes(location?.type);

	// Geometry bounds (f.eks kommunegrenser)
	if (normalizedGeometry && !skipBounds) {
		return {
			id: buildCameraId(location, "geometry", MAP_CAMERA.BOUNDS, normalizedGeometry),
			type: MAP_CAMERA.BOUNDS,
			data: normalizedGeometry,
			isArea: true
		};
	}

	// Search bounds fra geocoder
	if (normalizedSearch && !skipBounds) {
		return {
			id: buildCameraId(location, "search", MAP_CAMERA.BOUNDS, normalizedSearch),
			type: MAP_CAMERA.BOUNDS,
			data: normalizedSearch,
			isArea: isAreaLocation(location?.type)
		};
	}

	const bounds = normalizedGeometry ?? normalizedSearch;

	if (bounds) {

		const zoom = clampZoom(estimateZoomFromBounds(bounds));

		const centerLat = (bounds[1] + bounds[3]) / 2;
		const centerLon = (bounds[0] + bounds[2]) / 2;

		const center = {
			lat: centerLat,
			lon: centerLon,
			zoom
		};

		return {
			id: buildCameraId(location, "auto", MAP_CAMERA.CENTER, center),
			type: MAP_CAMERA.CENTER,
			data: center,
			isArea: true
		};
	}

	const center = buildFallbackCenter(location);

	return {
		id: buildCameraId(location, "center", MAP_CAMERA.CENTER, center),
		type: MAP_CAMERA.CENTER,
		data: center,
		isArea: isAreaLocation(location?.type)
	};
}