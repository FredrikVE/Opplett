// src/ui/utils/MapUtils/MarkerLayoutUtils.js

/**
 * Definerer prioritering basert på MapTiler-lagnavn.
 * Jo lavere verdi, jo høyere prioritet i hierarkiet.
 */
export function getLayerPriority(layerId) {
    if (!layerId) return 99;

    // BYER MÅ VINNE over land-navn for at vi skal få vær-ikonene vi vil ha
    if (layerId.includes("Capital")) return 0;
    if (layerId.includes("City")) return 1;
    if (layerId.includes("Town")) return 2;
    if (layerId.includes("Place")) return 3;

    // Fallback hvis slike lag likevel skulle slippe inn
    //if (layerId.includes("Country")) return 80;
    //if (layerId.includes("Continent")) return 90;

    return 99;
}

/**
 * Beregner en poengsum for prioritering av punkter (features).
 * Brukes av MarkerLayout for å avgjøre hvilke punkter som skal "vinne" kollisjonsdeteksjonen.
 *
 * Strategi:
 * 1. Lag-vekt (f.eks. Capital > City) utgjør "tier".
 * 2. Data-rank (props.rank) brukes for finjustering innenfor samme tier.
 *
 * @returns {number} Jo lavere score, jo viktigere er punktet.
 */
export function getFeaturePriorityScore(feature) {
    if (!feature) return 999;

    const props = feature.properties || {};
    const layerId = feature.layer?.id || "";

    const layerTier = getLayerPriority(layerId) * 10;

    const rawRank = props.rank ?? props.scalerank ?? 5;
    const parsedRank = Number(rawRank);
    const dataRank = Number.isFinite(parsedRank) ? parsedRank : 5;

    return layerTier + dataRank;
}

/**
 * Synkroniserer abstrakte markører fra MapTiler MarkerLayout med en intern Map-referanse.
 * Håndterer tilføying, oppdatering og sletting av markører basert på kartets synlige utsnitt.
 *
 * @param {Object} markerLayout - Instansen av MarkerLayout biblioteket
 * @param {Map} activeMarkers - En useRef Map som holder på de aktive abstrakte markørene
 * @returns {Array} En liste med alle gjeldende abstrakte markører
 */
export function syncAbstractMarkersFromLayout(markerLayout, activeMarkers) {
    if (!markerLayout || !(activeMarkers instanceof Map)) {
        console.warn("[MarkerLayoutUtils] syncAbstractMarkers mangler gyldige referanser.");
        return [];
    }

    const markerStatus = markerLayout.update();

    // Hvis markerStatus er null, betyr det at ingenting har endret seg i layouten
    if (!markerStatus) {
        return Array.from(activeMarkers.values());
    }

    try {
        if (markerStatus.removed?.forEach) {
            markerStatus.removed.forEach((abstractMarker) => {
                activeMarkers.delete(abstractMarker.id);
            });
        }

        if (markerStatus.updated?.forEach) {
            markerStatus.updated.forEach((abstractMarker) => {
                activeMarkers.set(abstractMarker.id, abstractMarker);
            });
        }

        if (markerStatus.new?.forEach) {
            markerStatus.new.forEach((abstractMarker) => {
                activeMarkers.set(abstractMarker.id, abstractMarker);
            });
        }
    } catch (error) {
        console.error("[MarkerLayoutUtils] Feil under synkronisering av markører:", error);
    }

    return Array.from(activeMarkers.values());
}