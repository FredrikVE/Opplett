//src/ui/utils/MapUtils/ExtractCityPoints.js
import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";
import { getMapConstraints } from "./MapConfig.js";

export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {
    if (!abstractMarkers?.length) return [];

    const { maxMarkers, minDistance } = getMapConstraints(zoom);
    const mappedPoints = [];
    const seen = new Set();

    const horizontalMult = 2.2;
    const verticalMult = 1.0;

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

    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

    for (const abstractMarker of sortedMarkers) {
        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const [lon, lat] = feature?.geometry?.coordinates ?? [];

        if (lat == null || lon == null) continue;

        const activeCountryCode = activeLocation?.countryCode?.toLowerCase();
        const itemCountryCode = (props.iso_a2 || props.country_code)?.toLowerCase();

        if (activeCountryCode && itemCountryCode && activeCountryCode !== itemCountryCode) {
            continue;
        }

        if (isTooClose(lat, lon)) continue;

        const exactKey = `${lat}:${lon}`;
        if (seen.has(exactKey)) continue;

        mappedPoints.push({
            id: feature.id,
            name: props.name,
            lat,
            lon
        });

        seen.add(exactKey);
    }

    return mappedPoints;
}