//src/ui/utils/MapUtils/Camera/MapLocationLogic.js
import { LOCATION_TYPES, MAP_ZOOM_LEVELS } from "../Constants/MapConstants.js";

export function isAreaLocation(type) {
	return [
		LOCATION_TYPES.CONTINENT,
		LOCATION_TYPES.MAJOR_LANDFORM,
		LOCATION_TYPES.COUNTRY,
		LOCATION_TYPES.REGION,
		LOCATION_TYPES.SUBREGION,
		LOCATION_TYPES.COUNTY,
		LOCATION_TYPES.MUNICIPALITY
	].includes(type);
}

export function shouldUseSearchBounds(type) {
	return ![
		LOCATION_TYPES.COUNTRY,
		LOCATION_TYPES.CONTINENT,
		LOCATION_TYPES.MAJOR_LANDFORM
	].includes(type);
}

export function getDefaultZoomForLocationType(type) {
	switch (type) {
		case LOCATION_TYPES.COUNTRY:
		case LOCATION_TYPES.MAJOR_LANDFORM:
			return MAP_ZOOM_LEVELS.COUNTRY;

		case LOCATION_TYPES.REGION:
			return MAP_ZOOM_LEVELS.REGION;

		case LOCATION_TYPES.SUBREGION:
		case LOCATION_TYPES.COUNTY:
			return MAP_ZOOM_LEVELS.COUNTY;

		case LOCATION_TYPES.CITY:
		case LOCATION_TYPES.MUNICIPALITY:
			return MAP_ZOOM_LEVELS.DISTRICT;

		case LOCATION_TYPES.ADDRESS:
		case LOCATION_TYPES.NEIGHBOURHOOD:
			return MAP_ZOOM_LEVELS.STREET;

		default:
			return MAP_ZOOM_LEVELS.DEFAULT;
	}
}