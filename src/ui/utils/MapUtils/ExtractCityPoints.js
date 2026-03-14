import { getMapConstraints, getMapSpacingMultipliers } from "./MapConfig.js";
import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";

/**
 * Trekker ut relevante bypunkter fra MapTiler MarkerLayout basert på zoom og lokasjon.
 */
export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {

    if (!abstractMarkers || abstractMarkers.length === 0) {
        return [];
    }

    const { maxMarkers, minDistance } = getMapConstraints(zoom, activeLocation?.type);
    const { HORIZONTAL, VERTICAL } = getMapSpacingMultipliers(activeLocation?.type);

    const mappedPoints = [];
    const seen = new Set();

    /**
     * MarkerLayout kan returnere markører i vilkårlig rekkefølge.
     * Vi sorterer derfor etter prioritet:
     *
     * Capital → City → Town → Village
     */
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {

        const aFeature = a?.features?.[0];
        const bFeature = b?.features?.[0];

        return (
            getFeaturePriorityScore(aFeature) -
            getFeaturePriorityScore(bFeature)
        );
    });

    /**
     * Iterer gjennom markørene og velg de beste
     */
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

        /**
         * Unngå eksakte duplikater
         */
        const exactKey = `${lat.toFixed(4)}:${lon.toFixed(4)}`;

        if (seen.has(exactKey)) {
            continue;
        }

        /**
         * Avstandssjekk
         * Hindrer at byer ligger for tett
         */
        const tooClose = mappedPoints.some((point) => {

            const dLat = Math.abs(point.lat - lat);
            const dLon = Math.abs(point.lon - lon);

            return (
                dLat < (minDistance * VERTICAL) &&
                dLon < (minDistance * HORIZONTAL)
            );
        });

        if (tooClose) {
            continue;
        }

        /**
         * Godkjent by
         */
        mappedPoints.push({
            id: feature.id ?? exactKey,
            name: props.name || props.name_en || "Ukjent sted",
            lat,
            lon
        });

        seen.add(exactKey);
    }

    return mappedPoints;
}