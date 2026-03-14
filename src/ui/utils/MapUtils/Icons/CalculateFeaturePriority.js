//src/ui/utils/MapUtils/Icons/CalculateFeaturePriority.js
function getLayerPriority(layerId = "") {
	if (layerId.includes("Capital")) return 0;
	if (layerId.includes("City")) return 1;
	if (layerId.includes("Town")) return 2;
	if (layerId.includes("Place")) return 3;
	return 99;
}

export function getFeaturePriorityScore(feature) {
	if (!feature) {
		return 999;
	}

	const props = feature.properties ?? {};
	const layerTier = getLayerPriority(feature.layer?.id ?? "") * 10;
	const rank = Number(props.rank ?? props.scalerank ?? 5);

	return layerTier + (Number.isFinite(rank) ? rank : 5);
}
