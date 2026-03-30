//src/hooks/useActiveLocation.js
import { useState, useMemo, useEffect } from "react";
import { resolveTimezone } from "../ui/utils/TimeZoneUtils/timeFormatters.js";

export default function useActiveLocation(coords, getLocationNameUseCase) {
    const [manualLocation, setManualLocation] = useState(null);
    const [enrichedLocation, setEnrichedLocation] = useState(null);

    const coordsKey =
        coords?.lat != null && coords?.lon != null
            ? `${coords.lat},${coords.lon}`
            : null;

    useEffect(() => {
        if (manualLocation != null) {
            return;
        }

        if (coords?.lat == null || coords?.lon == null) {
            return;
        }

        let cancelled = false;
        const requestKey = `${coords.lat},${coords.lon}`;

        async function loadLocationName() {
            try {
                const result = await getLocationNameUseCase.execute({
                    lat: coords.lat,
                    lon: coords.lon
                });

                if (!cancelled && result?.name) {
                    setEnrichedLocation({
                        key: requestKey,
                        name: result.name,
                        bounds: result.bounds || null,
                        type: result.type || null
                    });
                }
            } catch (error) {
                console.warn("Kunne ikke hente stedsnavn for GPS-posisjon", error);
            }
        }

        loadLocationName();

        return () => {
            cancelled = true;
        };
    }, [coords?.lat, coords?.lon, manualLocation, getLocationNameUseCase]);

    const activeLocation = useMemo(() => {
        const lat = manualLocation?.lat ?? coords?.lat ?? null;
        const lon = manualLocation?.lon ?? coords?.lon ?? null;
        const explicitTz = manualLocation?.timezone ?? null;

        const matchingEnrichedLocation =
            manualLocation == null &&
            enrichedLocation?.key === coordsKey
                ? enrichedLocation
                : null;

        let name;
        if (manualLocation != null) {
            name = manualLocation.name;
        }
         
        else if (matchingEnrichedLocation?.name) {
            name = matchingEnrichedLocation.name;
        } 
        
        else if (coords) {
            name = "Min posisjon";
        } 
        
        else {
            name = "";
        }

        const timezone = resolveTimezone(lat, lon, explicitTz, name);

        return {
            lat,
            lon,
            name,
            timezone,
            bounds: manualLocation?.bounds ?? matchingEnrichedLocation?.bounds ?? null,
            type: manualLocation?.type ?? matchingEnrichedLocation?.type ?? null,
            countryCode: manualLocation?.countryCode ?? null,
            id: manualLocation?.id ?? null
        };
    }, [manualLocation, coords, enrichedLocation, coordsKey]);

    const handleLocationChange = (newLocation) => {
        setManualLocation(newLocation);
    };

    const handleResetToDeviceLocation = () => {
        setManualLocation(null);
    };

    return {
        activeLocation,
        handleLocationChange,
        handleResetToDeviceLocation
    };
}