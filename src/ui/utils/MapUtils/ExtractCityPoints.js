// src/ui/utils/MapUtils/ExtractCityPoints.js
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "./MarkerLayoutUtils";

/**
 * Henter ut relevante punkter fra kartet for å vise værikoner.
 * Kombinerer brukerens valgte posisjon med byer som MapTiler finner i kartutsnittet.
 */
export function extractCityPoints({ map, markerLayout, activeMarkers, activeLocation }) {
    if (!map || !markerLayout) return [];

    // 1. Synkroniser markører fra MapTiler's MarkerLayout
    const abstractMarkers = syncAbstractMarkersFromLayout(markerLayout, activeMarkers);

    const mappedPoints = [];
    const seen = new Set();

    // 2. Legg til det valgte punktet (SSOT) – MED MINDRE det er et land.
    const isCountry = activeLocation?.type === "country";
    const hasCoords = activeLocation?.lat != null && activeLocation?.lon != null;

    if (hasCoords && !isCountry) {
        mappedPoints.push({
            ...activeLocation,
            isPriority: true 
        });

        // Bruker rå koordinater som streng for unik identifikasjon
        seen.add(`selected:${activeLocation.lat}:${activeLocation.lon}`);
    }

    // 3. Sorter byer fra kartet etter viktighet
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

    // 4. Map features til lokasjonsobjekter
    for (const abstractMarker of sortedMarkers) {
        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const geometry = feature?.geometry;

        if (!geometry || !props.name) continue;

        const [fLon, fLat] = geometry.coordinates;
        
        // Unik nøkkel basert på navn og rå koordinater for å unngå duplikater
        const dedupeKey = `${props.name}:${fLat}:${fLon}`;

        if (seen.has(dedupeKey)) continue;

        mappedPoints.push({
            id: feature.id ?? null,
            name: props.name,
            lat: fLat,
            lon: fLon,
            type: props.class || "city",
            isPriority: false
        });

        seen.add(dedupeKey);
    }

    return mappedPoints;
}