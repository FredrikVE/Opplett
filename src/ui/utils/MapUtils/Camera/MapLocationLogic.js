// src/ui/utils/MapUtils/Camera/MapLocationLogic.js
export const AREA_TYPES = new Set([
	"continental_marine",
	"major_landform",
	"country",
	"region",
	"subregion",
	"county",
	"municipality",
]);

export function isAreaLocation(type) {
	return AREA_TYPES.has(type);
}