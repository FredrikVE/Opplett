import { 
    getMapConstraints, 
    getMapSpacingMultipliers, 
    MAP_ZOOM_LEVELS 
} from "./MapConfig.js";
import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";

/**
 * Trekker ut relevante bypunkter fra MapTiler MarkerLayout basert på zoom og lokasjon.
 */
export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {
    if (!abstractMarkers?.length) {
        console.log("[ExtractCityPoints] Ingen abstractMarkers funnet i MarkerLayout.");
        return [];
    }

    // Henter dynamiske begrensninger basert på zoom og lokasjonstype
    const { 
        maxMarkers, 
        minDistance, 
        isGlobalView 
    } = getMapConstraints(zoom, activeLocation?.type);

    const { 
        HORIZONTAL: horizontalMult, 
        VERTICAL: verticalMult 
    } = getMapSpacingMultipliers(activeLocation?.type);

    const mappedPoints = [];
    const seen = new Set();

    /**
     * Sjekker om et nytt punkt er for nærme eksisterende punkter i klyngen.
     */
    function isTooClose(lat, lon) {
        return mappedPoints.some((point) => {
            const dLat = Math.abs(point.lat - lat);
            const dLon = Math.abs(point.lon - lon);

            return (
                dLat < (minDistance * verticalMult) &&
                dLon < (minDistance * horizontalMult)
            );
        });
    }

    // Sorterer markører etter prioritet (Hovedsteder -> Store byer -> Små steder)
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

    // Forbered landskode for sammenligning
    const activeCountryCode = activeLocation?.countryCode?.toLowerCase?.();

    for (const abstractMarker of sortedMarkers) {
        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const [lon, lat] = feature?.geometry?.coordinates ?? [];

        if (lat == null || lon == null) continue;

        // --- FILTER: LANDSKODE ---
        // Vi filtrerer kun på land hvis vi ikke er i "global modus" (lav zoom)
        if (!isGlobalView && activeCountryCode) {
            const itemCountryCode = (props.iso_a2 || props.country_code)?.toLowerCase?.();
            
            if (itemCountryCode && activeCountryCode !== itemCountryCode) {
                continue;
            }
        }

        // --- FILTER: AVSTAND ---
        if (isTooClose(lat, lon)) continue;

        // --- FILTER: DUPLIKATER ---
        const exactKey = `${lat}:${lon}`;
        if (seen.has(exactKey)) continue;

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