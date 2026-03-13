import { getMapConstraints, getMapSpacingMultipliers } from "./MapConfig.js";
import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";

/**
 * Trekker ut relevante bypunkter fra MapTiler MarkerLayout basert på zoom og lokasjon.
 */
export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {
    if (!abstractMarkers?.length) return [];

    const { maxMarkers, minDistance } = getMapConstraints(zoom, activeLocation?.type);
    const { HORIZONTAL, VERTICAL } = getMapSpacingMultipliers(activeLocation?.type);

    const mappedPoints = [];
    const seen = new Set();

    // 1. Sorter etter prioritet (Hovedstad -> By -> Tettsted)
    const sortedMarkers = [...abstractMarkers].sort((a, b) => 
        getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0])
    );

    // 2. Gå gjennom markørene og plukk de beste
    for (const abstractMarker of sortedMarkers) {
        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        const [lon, lat] = feature?.geometry?.coordinates ?? [];
        const props = feature?.properties;

        // Hopp over ugyldige data
        if (!props || lat == null || lon == null) continue;

        // Unngå eksakte duplikater
        const exactKey = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
        if (seen.has(exactKey)) continue;

        // Sjekk om byen er for nærme en vi allerede har lagt til
        const isTooClose = mappedPoints.some(p => 
            Math.abs(p.lat - lat) < (minDistance * VERTICAL) &&
            Math.abs(p.lon - lon) < (minDistance * HORIZONTAL)
        );

        if (isTooClose) continue;

        // Godkjent! Legg til i listen.
        mappedPoints.push({
            id: feature.id,
            name: props.name || props.name_en || "Ukjent sted",
            lat,
            lon
        });

        seen.add(exactKey);
    }

    return mappedPoints;
}