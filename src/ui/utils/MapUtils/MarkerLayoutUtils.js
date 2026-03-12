/**
 * Definerer prioritering basert på MapTiler-lagnavn.
 * Jo lavere verdi, jo høyere prioritet i hierarkiet.
 */
export function getLayerPriority(layerId) {
    if (!layerId) return 99;

    if (layerId.includes("Country") || layerId.includes("Continent")) return 0;
    if (layerId.includes("Capital")) return 1;
    if (layerId.includes("City")) return 2;
    if (layerId.includes("Town")) return 3;
    if (layerId.includes("Place")) return 4;

    return 99;
}

/**
 * Beregner en poengsum for prioritering av punkter (features).
 * Brukes av MarkerLayout for å avgjøre hvilke punkter som skal "vinne" kollisjonsdeteksjonen.
 * * Strategi:
 * 1. Lag-vekt (f.eks. Capital > City) utgjør "tier".
 * 2. Data-rank (props.rank) brukes for finjustering innenfor samme tier.
 * * @returns {number} Jo lavere score, jo viktigere er punktet.
 */
export function getFeaturePriorityScore(feature) {
    if (!feature) return 999;

    const props = feature.properties || {};
    const layerId = feature.layer?.id || "";

    // Henter tier-score (0, 10, 20 osv.) for å skape store hopp mellom lagtyper
    const layerTier = getLayerPriority(layerId) * 10;

    // Henter intern rangering fra MapTiler-data (vanligvis 1-10)
    // Vi faller tilbake til 5 som en nøytral midtverdi hvis rank mangler
    const dataRank = Number(props.rank || props.scalerank || 5);

    return layerTier + dataRank;
}

/**
 * Synkroniserer abstrakte markører fra MapTiler MarkerLayout med en intern Map-referanse.
 * Håndterer tilføying, oppdatering og sletting av markører basert på kartets synlige utsnitt.
 * * @param {Object} markerLayout - Instansen av MarkerLayout biblioteket
 * @param {Map} activeMarkers - En useRef Map som holder på de aktive abstrakte markørene
 * @returns {Array} En liste med alle gjeldende abstrakte markører
 */
export function syncAbstractMarkersFromLayout(markerLayout, activeMarkers) {
    if (!markerLayout || !activeMarkers || !(activeMarkers instanceof Map)) {
        console.warn("[MarkerLayoutUtils] syncAbstractMarkers mangler gyldige referanser.");
        return [];
    }

    // Trigger oppdatering i biblioteket (beregner kollisjoner og synlighet)
    const markerStatus = markerLayout.update();

    // Hvis markerStatus er null, betyr det at ingenting har endret seg i layouten
    if (!markerStatus) {
        return Array.from(activeMarkers.values());
    }

    try {
        // Fjern markører som ikke lenger skal vises (f.eks. pga kollisjon eller zoom)
        if (markerStatus.removed) {
            markerStatus.removed.forEach(am => activeMarkers.delete(am.id));
        }

        // Oppdater eksisterende markører som har endret posisjon eller egenskaper
        if (markerStatus.updated) {
            markerStatus.updated.forEach(am => activeMarkers.set(am.id, am));
        }

        // Legg til helt nye markører som har kommet inn i utsnittet
        if (markerStatus.new) {
            markerStatus.new.forEach(am => activeMarkers.set(am.id, am));
        }
    } catch (error) {
        console.error("[MarkerLayoutUtils] Feil under synkronisering av markører:", error);
    }

    return Array.from(activeMarkers.values());
}