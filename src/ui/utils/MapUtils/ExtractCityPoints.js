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

    // Sorterer markører etter prioritet (Hovedsteder -> Store byer -> Små steder)
    // Dette sikrer at de viktigste punktene vurderes først i kollisjonslogikken.
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

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

    // Forbered landskode for sammenligning
    const activeCountryCode = activeLocation?.countryCode?.toLowerCase?.();

    for (const abstractMarker of sortedMarkers) {
        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const layerId = feature?.layer?.id || "";
        const [lon, lat] = feature?.geometry?.coordinates ?? [];

        if (lat == null || lon == null) continue;

        // --- FILTER: LAG-TYPE ---
        // Hvis vi har zoomet inn nok til å se land-detaljer (zoom > 3), 
        // ignorerer vi rene land-merkelapper (f.eks. "Norge") for å gi plass til byer.
        const isCountryOrContinent = layerId.includes("Country") || layerId.includes("Continent");
        if (isCountryOrContinent && zoom > 3.5) {
            continue;
        }

        // --- FILTER: LANDSKODE ---
        // Vi filtrerer kun på land hvis vi ikke er i "global modus" (veldig lav zoom)
        if (!isGlobalView && activeCountryCode) {
            // Sjekker flere mulige felt for landskode (MapTiler bruker ulike felt på ulike zoomnivå)
            const itemCountryCode = (props.iso_a2 || props.country_code || props.adm0_a3)?.toLowerCase?.();
            
            // Hvis punktet har en landskode, og den ikke matcher søket vårt, hopper vi over det.
            // Men vi tillater punkter som mangler landskode (fallback) for å unngå tomme kart.
            if (itemCountryCode && activeCountryCode !== itemCountryCode) {
                // Spesialhåndtering: adm0_a3 (f.eks 'NOR') vs iso_a2 (f.eks 'no')
                const isNor = activeCountryCode === 'no' && itemCountryCode === 'nor';
                if (!isNor) continue;
            }
        }

        // --- FILTER: AVSTAND ---
        if (isTooClose(lat, lon)) continue;

        // --- FILTER: DUPLIKATER ---
        // Bruker avrunding til 6 desimaler for å unngå floating-point presisjonsproblemer
        const exactKey = `${lat.toFixed(6)}:${lon.toFixed(6)}`;
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