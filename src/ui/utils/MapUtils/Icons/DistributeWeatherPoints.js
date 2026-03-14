//src/ui/utils/MapUtils/Icons/DistributeWeatherPoints.js
import { getMapConstraints, getMapSpacingMultipliers } from "./MapMarkerLogic.js";
import { getFeaturePriorityScore } from "./CalculateFeaturePriority.js";

export function distributeWeatherPoints(abstractMarkers, zoom, activeLocation) {
	if (!abstractMarkers || abstractMarkers.length === 0) {
		return [];
	}

	const { maxMarkers, minDistance } = getMapConstraints(zoom, activeLocation?.type);
	const { HORIZONTAL, VERTICAL } = getMapSpacingMultipliers(activeLocation?.type);

	const mappedPoints = [];
	const fallbackCandidates = [];
	const seen = new Set();

	const sortedMarkers = [...abstractMarkers].sort((a, b) => {
		const aFeature = a?.features?.[0];
		const bFeature = b?.features?.[0];

		return getFeaturePriorityScore(aFeature) - getFeaturePriorityScore(bFeature);
	});

	for (const abstractMarker of sortedMarkers) {
		if (mappedPoints.length >= maxMarkers) {
			break;
		}

		const feature = abstractMarker?.features?.[0];
		const coordinates = feature?.geometry?.coordinates;
		const props = feature?.properties;

		if (!feature || !coordinates || !props) {
			continue;
		}

		const [lon, lat] = coordinates;

		if (lat == null || lon == null) {
			continue;
		}

		const exactKey = `${lat.toFixed(4)}:${lon.toFixed(4)}`;

		if (seen.has(exactKey)) {
			continue;
		}

		const tooClose = mappedPoints.some((point) => {
			const dLat = Math.abs(point.lat - lat);
			const dLon = Math.abs(point.lon - lon);

			return (
				dLat < (minDistance * VERTICAL) &&
				dLon < (minDistance * HORIZONTAL)
			);
		});

		if (tooClose) {
			// lagre som fallback hvis vi trenger flere senere
			fallbackCandidates.push({
				id: feature.id ?? exactKey,
				name: props.name || props.name_en || "Ukjent sted",
				lat,
				lon
			});
			continue;
		}

		mappedPoints.push({
			id: feature.id ?? exactKey,
			name: props.name || props.name_en || "Ukjent sted",
			lat,
			lon
		});

		seen.add(exactKey);
	}

	//Hvis vi fikk for få punkter (typisk små områder)
	const minimumTarget = Math.ceil(maxMarkers * 0.4);

	if (mappedPoints.length < minimumTarget) {
		for (const candidate of fallbackCandidates) {
			if (mappedPoints.length >= maxMarkers) break;

			mappedPoints.push(candidate);
		}
	}

	return mappedPoints;
}