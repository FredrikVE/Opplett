// src/ui/utils/MapUtils/ExtractCityPoints.js
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "./MarkerLayoutUtils";
import { getMapConstraints } from "./MapConfig";

export function extractCityPoints({ map, markerLayout, activeMarkers, activeLocation }) {
    if (!map || !markerLayout) return [];

    const abstractMarkers = syncAbstractMarkersFromLayout(markerLayout, activeMarkers);
    const mappedPoints = [];
    const seen = new Set();
    
    const zoom = map.getZoom();
    
    // HENTER SSOT
    const { maxMarkers, minDistance } = getMapConstraints(zoom);

    const horizontalMult = 2.2; 
    const verticalMult = 1.0;

    function isTooClose(lat, lon) {
        return mappedPoints.some(p => {
            const dLat = Math.abs(p.lat - lat);
            const dLon = Math.abs(p.lon - lon);
            return dLat < (minDistance * verticalMult) && dLon < (minDistance * horizontalMult);
        });
    }

    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

    for (const abstractMarker of sortedMarkers) {
        // Bruker maxMarkers fra SSOT
        if (mappedPoints.length >= maxMarkers) break;

        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const [fLon, fLat] = feature.geometry.coordinates;

        // Landfilter
        const activeCountryCode = activeLocation?.countryCode?.toLowerCase();
        const itemCountryCode = (props.iso_a2 || props.country_code)?.toLowerCase();
        if (activeCountryCode && itemCountryCode && activeCountryCode !== itemCountryCode) continue;

        if (isTooClose(fLat, fLon)) continue;

        const exactKey = `${fLat}:${fLon}`;
        if (seen.has(exactKey)) continue;

        mappedPoints.push({
            id: feature.id,
            name: props.name,
            lat: fLat,
            lon: fLon
        });
        seen.add(exactKey);
    }

    return mappedPoints;
}