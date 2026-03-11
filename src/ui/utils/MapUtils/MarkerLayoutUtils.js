//src/ui/utils/MapUtils/MarkerLayoutUtils.js
// maptiler/markerLayoutUtils.js

export function getLayerPriority(layerId) {
	switch (layerId) {
		case "Capital city labels": return 0;
		case "City labels": return 1;
		case "Town labels": return 2;
		case "Place labels": return 3;
		default: return 99;
	}
}

export function getFeaturePriorityScore(feature) {
	const props = feature.properties || {};
	const rank = Number(props.rank ?? 9999);
	const layerPriority = getLayerPriority(feature.layer?.id);

	return layerPriority * 10000 + rank;
}

export function syncAbstractMarkersFromLayout(markerLayout, activeMarkers) {

	if (!markerLayout) return [];

	const markerStatus = markerLayout.update();

	if (!markerStatus) {
		return Array.from(activeMarkers.values());
	}

	markerStatus.removed.forEach(am => activeMarkers.delete(am.id));
	markerStatus.updated.forEach(am => activeMarkers.set(am.id, am));
	markerStatus.new.forEach(am => activeMarkers.set(am.id, am));

	return Array.from(activeMarkers.values());
}
