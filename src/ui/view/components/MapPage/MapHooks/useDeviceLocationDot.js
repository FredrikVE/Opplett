//src/ui/view/components/MapPage/hooks/useDeviceLocationDot.js
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";

function createDotElement() {
    const container = document.createElement("div");
    container.className = "device-location-marker";

    const pulse = document.createElement("div");
    pulse.className = "device-location-pulse";

    const dot = document.createElement("div");
    dot.className = "device-location-dot";

    container.appendChild(pulse);
    container.appendChild(dot);

    return container;
}

export function useDeviceLocationDot(map, deviceCoords) {
    const markerRef = useRef(null);

    const createMarker = useCallback((lat, lon) => {
        return new maptilersdk.Marker({
            element: createDotElement(),
            anchor: "center",
        })
            .setLngLat([lon, lat])
            .addTo(map);
    }, [map]);

    const removeMarker = useCallback(() => {
        markerRef.current?.remove();
        markerRef.current = null;
    }, []);

    const onDeviceCoordsChangedSyncMarker = useCallback(() => {
        if (!map || !deviceCoords?.lat || !deviceCoords?.lon) {
            removeMarker();
            return;
        }

        if (markerRef.current) {
            markerRef.current.setLngLat([deviceCoords.lon, deviceCoords.lat]);
            return;
        }

        markerRef.current = createMarker(deviceCoords.lat, deviceCoords.lon);

        return () => {
            removeMarker();
        };
    }, [map, deviceCoords, createMarker, removeMarker]);

    useEffect(onDeviceCoordsChangedSyncMarker, [
        onDeviceCoordsChangedSyncMarker
    ]);
}