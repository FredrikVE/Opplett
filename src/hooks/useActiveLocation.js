import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveTimezone } from "../ui/utils/TimeZoneUtils/timeFormatters.js";

function createCoordsKey(lat, lon) {
    return lat != null && lon != null ? `${lat},${lon}` : null;
}

function resolveLocationName({ manualLocation, enrichedLocation, hasCoords }) {
    if (manualLocation?.name) {
        return manualLocation.name;
    }

    if (enrichedLocation?.name) {
        return enrichedLocation.name;
    }

    if (hasCoords) {
        return "Min posisjon";
    }

    return "";
}

export default function useActiveLocation(coords, getLocationNameUseCase) {
    const [manualLocation, setManualLocation] = useState(null);
    const [enrichedDeviceLocation, setEnrichedDeviceLocation] = useState(null);

    const lat = coords?.lat ?? null;
    const lon = coords?.lon ?? null;

    const hasCoords = lat != null && lon != null;
    const shouldUseDeviceLocation = manualLocation == null;
    const coordsKey = createCoordsKey(lat, lon);

    const handleResetToDeviceLocation = useCallback(() => {
        setManualLocation(null);
    },
    []);

    const handleLocationChange = useCallback((newLocation) => {
        setManualLocation(newLocation);
    }, 
    []);

    const onDeviceCoordsChangedLoadLocationName = useCallback(() => {
        if (!shouldUseDeviceLocation || !hasCoords) {
            return;
        }

        let cancelled = false;

        const run = async () => {
            try {
                const result = await getLocationNameUseCase.execute({ lat, lon });

                if (cancelled || !result?.name) {
                    return;
                }

                setEnrichedDeviceLocation({
                    key: createCoordsKey(lat, lon),
                    name: result.name,
                    bounds: result.bounds ?? null,
                    type: result.type ?? null
                });
            } catch (error) {
                console.warn("Kunne ikke hente stedsnavn for GPS-posisjon", error);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, 

    [shouldUseDeviceLocation, hasCoords, lat, lon, getLocationNameUseCase]);

    useEffect(onDeviceCoordsChangedLoadLocationName, [onDeviceCoordsChangedLoadLocationName]);

    const activeLocation = useMemo(() => {
        const activeLat = manualLocation?.lat ?? lat;
        const activeLon = manualLocation?.lon ?? lon;
        const explicitTimezone = manualLocation?.timezone ?? null;

        const matchingEnrichedDeviceLocation =
            shouldUseDeviceLocation && enrichedDeviceLocation?.key === coordsKey
                ? enrichedDeviceLocation
                : null;

        const name = resolveLocationName({
            manualLocation,
            enrichedLocation: matchingEnrichedDeviceLocation,
            hasCoords
        });

        return {
            lat: activeLat,
            lon: activeLon,
            name,
            timezone: resolveTimezone(activeLat, activeLon, explicitTimezone, name),
            bounds: manualLocation?.bounds ?? matchingEnrichedDeviceLocation?.bounds ?? null,
            type: manualLocation?.type ?? matchingEnrichedDeviceLocation?.type ?? null,
            countryCode: manualLocation?.countryCode ?? null,
            id: manualLocation?.id ?? null
        };
    }, 
    
    [manualLocation, lat, lon, enrichedDeviceLocation, coordsKey, shouldUseDeviceLocation, hasCoords]);

    return {
        activeLocation,
        handleLocationChange,
        handleResetToDeviceLocation
    };
}