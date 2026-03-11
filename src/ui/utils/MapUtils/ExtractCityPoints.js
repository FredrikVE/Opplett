//src/ui/utils/MapUtils/ExtractCityPoints.js
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "./MarkerLayoutUtils";

export function extractCityPoints({map, markerLayout, activeMarkers, activeLocation}) {

    if (!map) return [];

    const abstractMarkers = syncAbstractMarkersFromLayout(
        markerLayout,
        activeMarkers
    );

    const mappedPoints = [];
    const seen = new Set();

    const selectedType = activeLocation?.type ?? null;
    const selectedBounds = activeLocation?.bounds ?? null;
    const pointLat = activeLocation?.lat;
    const pointLon = activeLocation?.lon;

    const shouldIncludeSelectedPoint =
        pointLat != null && pointLon != null;

    if (shouldIncludeSelectedPoint) {

        mappedPoints.push({
            id: activeLocation?.id ?? null,
            name: activeLocation?.name || "Valgt posisjon",
            lat: pointLat,
            lon: pointLon,
            type: selectedType,
            bounds: selectedBounds,
            countryCode: activeLocation?.countryCode ?? null,
            context: activeLocation?.context ?? [],
            isPriority: true
        });

        seen.add(`selected:${pointLat.toFixed(4)}:${pointLon.toFixed(4)}`);
    }

    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) -
               getFeaturePriorityScore(b.features?.[0]);
    });

    for (const abstractMarker of sortedMarkers) {

        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const geometry = feature?.geometry;

        if (!geometry || !props.name) continue;

        const fLon = geometry.coordinates[0];
        const fLat = geometry.coordinates[1];

        const dedupeKey = `${props.name}:${fLat.toFixed(4)}:${fLon.toFixed(4)}`;

        if (seen.has(dedupeKey)) continue;

        mappedPoints.push({
            id: feature.id ?? null,
            name: props.name,
            lon: fLon,
            lat: fLat,
            type: props.class || "city",
            rank: Number(props.rank ?? 9999),
            layerId: feature.layer?.id ?? null,
            countryCode: props.iso_a2 || props.country_code || null,
            context: feature.context || [],
            isPriority: false
        });

        seen.add(dedupeKey);
    }

    return mappedPoints;
}