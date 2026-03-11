// src/ui/utils/MapUtils/ExtractCityPoints.js
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "./MarkerLayoutUtils";
import { MAP_ZOOM_LEVELS, SPATIAL_FILTER } from "./MapZoomLevels";

export function extractCityPoints({ map, markerLayout, activeMarkers, activeLocation }) {
    if (!map || !markerLayout) return [];

    const abstractMarkers = syncAbstractMarkersFromLayout(markerLayout, activeMarkers);
    const mappedPoints = [];
    const seen = new Set();
    
    const currentZoom = Math.round(map.getZoom());
    const activeCountryCode = activeLocation?.countryCode?.toLowerCase();

    // --- SSOT LOGIKK FOR SPREDNING ---
    let minDistance = 0.05; // Standard (veldig tett) for dyp zoom

    if (currentZoom <= MAP_ZOOM_LEVELS.COUNTRY) {
        minDistance = SPATIAL_FILTER[MAP_ZOOM_LEVELS.COUNTRY];
    } else if (currentZoom <= MAP_ZOOM_LEVELS.REGION) {
        minDistance = SPATIAL_FILTER[MAP_ZOOM_LEVELS.REGION];
    } else if (currentZoom <= MAP_ZOOM_LEVELS.COUNTY) {
        minDistance = SPATIAL_FILTER[MAP_ZOOM_LEVELS.COUNTY];
    }

    function isTooClose(lat, lon) {
        return mappedPoints.some(p => {
            const dLat = Math.abs(p.lat - lat);
            const dLon = Math.abs(p.lon - lon);
            return dLat < minDistance && dLon < minDistance;
        });
    }

    // Prioriterings-sortering (Hovedsteder og store byer først)
    const sortedMarkers = [...abstractMarkers].sort((a, b) => {
        return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
    });

    for (const abstractMarker of sortedMarkers) {
        const feature = abstractMarker.features?.[0];
        const props = feature?.properties || {};
        const [fLon, fLat] = feature.geometry.coordinates;
        const itemCountryCode = (props.iso_a2 || props.country_code)?.toLowerCase();

        // 1. LANDFILTER: Kast ut Moskva/London hvis vi ser på Norge
        if (activeCountryCode && itemCountryCode && activeCountryCode !== itemCountryCode) {
            continue;
        }

        // 2. SPREDNINGSFILTER: Bruker minDistance fra SSOT
        const isCapital = feature?.layer?.id === "Capital city labels";
        // Vi tillater alltid hovedsteder (Oslo må alltid med!)
        if (!isCapital && isTooClose(fLat, fLon)) {
            continue;
        }

        const exactKey = `${fLat}:${fLon}`;
        if (seen.has(exactKey)) continue;

        mappedPoints.push({
            id: feature.id,
            name: props.name,
            lat: fLat,
            lon: fLon,
            isPriority: isCapital
        });
        seen.add(exactKey);
    }

    return mappedPoints;
}