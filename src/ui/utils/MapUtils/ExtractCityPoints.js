import { getFeaturePriorityScore } from "./MarkerLayoutUtils.js";
import { getMapConstraints } from "./MapConfig.js";

export function extractCityPointsFromMarkers({ abstractMarkers, zoom, activeLocation }) {
    if (!abstractMarkers?.length) {
        console.log("[ExtractCityPoints] Ingen abstractMarkers");
        return [];
    }

    const { maxMarkers, minDistance } = getMapConstraints(zoom);
    const mappedPoints = [];
    const seen = new Set();

    const horizontalMult = 2.2;
    const verticalMult = 1.0;

    console.log("[ExtractCityPoints] START", {
        activeLocationName: activeLocation?.name,
        activeLocationType: activeLocation?.type,
        activeCountryCode: activeLocation?.countryCode,
        zoom,
        abstractMarkerCount: abstractMarkers.length,
        maxMarkers,
        minDistance
    });

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

        if (lat == null || lon == null) {
            console.log("[ExtractCityPoints] SKIP ugyldig koordinat", {
                name: props.name
            });
            continue;
        }

        const activeCountryCode = activeLocation?.countryCode?.toLowerCase?.();
        const itemCountryCode = (props.iso_a2 || props.country_code)?.toLowerCase?.();

        if (activeCountryCode && itemCountryCode && activeCountryCode !== itemCountryCode) {
            console.log("[ExtractCityPoints] SKIP feil land", {
                name: props.name,
                activeCountryCode,
                itemCountryCode,
                layerId: feature?.layer?.id,
                rank: props.rank
            });
            continue;
        }

        if (isTooClose(lat, lon)) {
            console.log("[ExtractCityPoints] SKIP for nær", {
                name: props.name,
                lat,
                lon
            });
            continue;
        }

        const exactKey = `${lat}:${lon}`;
        if (seen.has(exactKey)) {
            console.log("[ExtractCityPoints] SKIP duplikat", {
                name: props.name,
                lat,
                lon
            });
            continue;
        }

        console.log("[ExtractCityPoints] ADD", {
            name: props.name,
            lat,
            lon,
            layerId: feature?.layer?.id,
            rank: props.rank,
            itemCountryCode
        });

        mappedPoints.push({
            id: feature.id,
            name: props.name,
            lat,
            lon
        });

        seen.add(exactKey);
    }

    console.log("[ExtractCityPoints] DONE", {
        resultCount: mappedPoints.length,
        names: mappedPoints.map((p) => p.name)
    });

    return mappedPoints;
}