//src/ui/utils/MapUtils/Icons/MapMarkerLogic.js
import { MAP_MARKER_DISTRIBUTION } from "../Constants/MapConstants.js";
import { isAreaLocation } from "../Camera/MapLocationLogic.js";

export function getMapConstraints(zoom, locationType) {
	const isArea = isAreaLocation(locationType);
	const isGlobalView = zoom < MAP_MARKER_DISTRIBUTION.GLOBAL_ZOOM_THRESHOLD;
	const isLowZoom = zoom < MAP_MARKER_DISTRIBUTION.LOW_ZOOM_THRESHOLD;

	const limitPolicy = isArea
		? MAP_MARKER_DISTRIBUTION.MARKER_LIMITS.AREA
		: MAP_MARKER_DISTRIBUTION.MARKER_LIMITS.POINT;

	let minDistanceCap = (zoom > 8 && !isArea)
		? 0.001
		: (
			isArea
				? MAP_MARKER_DISTRIBUTION.MIN_DISTANCE_CAP_DEGREES.AREA
				: MAP_MARKER_DISTRIBUTION.MIN_DISTANCE_CAP_DEGREES.POINT
		);

	if (isLowZoom) {
		minDistanceCap = MAP_MARKER_DISTRIBUTION.LOW_ZOOM_MIN_DISTANCE_CAP;
	}

	let maxMarkers = limitPolicy.DEFAULT;

	if (zoom < MAP_MARKER_DISTRIBUTION.ZOOM_BREAKPOINTS.FAR) {
		maxMarkers = limitPolicy.FAR;
	} 
	
	else if (zoom < MAP_MARKER_DISTRIBUTION.ZOOM_BREAKPOINTS.MID) {
		maxMarkers = limitPolicy.MID;
	}

	const zoomMultiplier = isLowZoom
		? MAP_MARKER_DISTRIBUTION.LOW_ZOOM_DISTANCE_MULTIPLIER
		: 1.0;

	const rawMinDistance =
		(MAP_MARKER_DISTRIBUTION.BASE_DISTANCE_DEGREES / Math.pow(2, zoom)) * zoomMultiplier;

	const minDistance = Math.min(
		Math.max(rawMinDistance, minDistanceCap),
		MAP_MARKER_DISTRIBUTION.MAX_DISTANCE_CAP_DEGREES
	);

	return {
		maxMarkers,
		minDistance,
		isGlobalView
	};
}

export function getMapSpacingMultipliers(locationType) {
	return isAreaLocation(locationType)
		? MAP_MARKER_DISTRIBUTION.SPACING_MULTIPLIERS.AREA
		: MAP_MARKER_DISTRIBUTION.SPACING_MULTIPLIERS.POINT;
}