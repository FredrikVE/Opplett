// src/ui/utils/MapUtils/MarkerLayoutUtils.js

/**
 * Definerer prioritering basert på MapTiler-lagnavn.
 */
export function getLayerPriority(layerId) {
    switch (layerId) {
        case "Capital city labels": return 0;
        case "City labels": return 1;
        case "Town labels": return 2;
        case "Place labels": return 3;
        default: return 99;
    }
}

/**
 * Beregner en poengsum for prioritering av punkter.
 * Jo lavere score, jo viktigere er punktet (vises først).
 */
export function getFeaturePriorityScore(feature) {
    const props = feature?.properties || {};
    
    // MapTiler gir ofte byer en 'rank' (1 er viktigst). Default til 10 hvis mangler.
    const rank = Number(props.rank ?? 10); 
    
    // Sjekk om det er en hovedstad via lag-id
    const isCapital = feature?.layer?.id === "Capital city labels";
    
    // Hovedsteder får et kraftig "boost" (lavere score)
    const layerBoost = isCapital ? 0 : 10;
    
    return layerBoost + rank; 
}

/**
 * Synkroniserer abstrakte markører fra MapTiler MarkerLayout med en intern Map.
 * Dette er kritisk for å unngå krasj ved re-renders og for å holde oversikt over synlige punkter.
 * * @param {Object} markerLayout - Instansen av MapTiler MarkerLayout
 * @param {Map} activeMarkers - En Map-referanse (vanligvis fra en useRef i hooken)
 * @returns {Array} - En liste over alle aktive abstrakte markører
 */
export function syncAbstractMarkersFromLayout(markerLayout, activeMarkers) {
    // Sjekker at vi har både layout-motoren og en gyldig Map-referanse for å unngå krasj
    if (!markerLayout || !activeMarkers || !(activeMarkers instanceof Map)) {
        console.warn("[MarkerLayoutUtils] syncAbstractMarkers mangler gyldig activeMarkers Map.");
        return [];
    }

    const markerStatus = markerLayout.update();

    // Hvis layout-motoren ikke returnerer endringer, returner det vi allerede har i minnet
    if (!markerStatus) {
        return Array.from(activeMarkers.values());
    }

    // SSOT: Oppdaterer Map-en basert på hva som faktisk er synlig i kartutsnittet akkurat nå
    try {
        if (markerStatus.removed) {
            markerStatus.removed.forEach(am => activeMarkers.delete(am.id));
        }
        if (markerStatus.updated) {
            markerStatus.updated.forEach(am => activeMarkers.set(am.id, am));
        }
        if (markerStatus.new) {
            markerStatus.new.forEach(am => activeMarkers.set(am.id, am));
        }
    } catch (error) {
        console.error("[MarkerLayoutUtils] Feil under synkronisering av markører:", error);
    }

    return Array.from(activeMarkers.values());
}