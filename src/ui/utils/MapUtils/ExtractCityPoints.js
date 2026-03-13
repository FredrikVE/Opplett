import { getMapConstraints, getMapSpacingMultipliers } from "./MapConfig.js";
import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";


/**
 * Trekker ut relevante bypunkter fra MapTiler MarkerLayout basert på zoom og lokasjon.
 */
export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {

    if (!abstractMarkers?.length) {
        console.log("[ExtractCityPoints] Ingen abstractMarkers funnet i MarkerLayout.");
        return [];
    }

    const { maxMarkers, minDistance } = getMapConstraints(zoom, activeLocation?.type);

    const { 
        HORIZONTAL: horizontalMult, 
        VERTICAL: verticalMult 
    } = getMapSpacingMultipliers(activeLocation?.type);

    const mappedPoints = [];
    const seen = new Set();

    const activeCountryCode = activeLocation?.countryCode?.toLowerCase?.();
    const isCountrySearch = activeLocation?.type === "country";


    /**
     * MapTiler bruker både ISO-A2 og ISO-A3.
     * Denne hjelperen matcher dem.
     */
    function countryCodeMatches(activeCode, itemCode) {

        if (!activeCode || !itemCode) return true;

        const a = activeCode.toLowerCase();
        const b = itemCode.toLowerCase();

        if (a === b) return true;

        const alpha2To3 = {
            no: "nor",
            se: "swe",
            fi: "fin",
            dk: "dnk",
            nl: "nld",
            de: "deu",
            gb: "gbr",
            uk: "gbr",
            ee: "est",
            is: "isl",
            by: "blr",
            pk: "pak"
        };

        return alpha2To3[a] === b;
    }


    /**
     * Sjekker om et nytt punkt er for nærme eksisterende punkter.
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


    /**
     * Sorterer etter prioritet:
     * Capital → City → Town → Place
     */
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {

        return getFeaturePriorityScore(a.features?.[0]) -
               getFeaturePriorityScore(b.features?.[0]);

    });


    for (const abstractMarker of sortedMarkers) {

        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        if (!feature) continue;

        const props = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates ?? [];

        if (lat == null || lon == null) continue;


        /**
         * FILTER 1: Kun byer
         */
        const featureClass = props.class;

        if (!["city", "town", "village"].includes(featureClass)) {
            continue;
        }


        /**
         * FILTER 2: Landsfilter når vi har valgt land
         */
        const itemCountryCode =
            (props.iso_a2 ||
             props.country_code ||
             props.adm0_a3)?.toLowerCase?.();

        if (isCountrySearch && activeCountryCode && itemCountryCode) {

            if (!countryCodeMatches(activeCountryCode, itemCountryCode)) {
                continue;
            }
        }


        /**
         * FILTER 3: Avstand
         */
        if (isTooClose(lat, lon)) continue;


        /**
         * FILTER 4: Duplikater
         */
        const exactKey = `${lat.toFixed(6)}:${lon.toFixed(6)}`;

        if (seen.has(exactKey)) continue;


        mappedPoints.push({
            id: feature.id,
            //id: feature.id ?? `${lat.toFixed(6)}:${lon.toFixed(6)}`,
            name: props.name || props.name_en || "Ukjent sted",
            lat,
            lon
        });

        seen.add(exactKey);
    }

    return mappedPoints;
}