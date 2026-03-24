// src/ui/utils/MapUtils/Camera/MapLocationLogic.js
import { LOCATION_TYPES } from "../Constants/MapConstants.js";

/**
 * Er denne lokasjonstypen et område (land, fylke, kommune osv.)?
 * Brukes til å avgjøre om vi skal hente geometri for highlight.
 */
export function isAreaLocation(type) {
	return [
		LOCATION_TYPES.CONTINENT,
		LOCATION_TYPES.MAJOR_LANDFORM,
		LOCATION_TYPES.COUNTRY,
		LOCATION_TYPES.REGION,
		LOCATION_TYPES.SUBREGION,
		LOCATION_TYPES.COUNTY,
		LOCATION_TYPES.MUNICIPALITY,
	].includes(type);
}
