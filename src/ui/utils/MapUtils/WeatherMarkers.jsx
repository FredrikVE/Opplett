//src/ui/utils/MapUtils/WeatherMarkers.jsx
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../../view/components/MapPage/WeatherSymbolLabel.jsx";

const REACT_UNMOUNT_DELAY_MS = 0;

function safelyUnmountRootLater(root) {
    if (!root) return;

    setTimeout(() => {
        try {
            root.unmount();
        } catch (error) {
            console.warn("[WeatherMarkers] Feil ved utsatt unmount av root:", error);
        }
    }, REACT_UNMOUNT_DELAY_MS);
}

function removeMarkerEntry(entry) {
    if (!entry) return;

    try {
        entry.marker?.remove();
    } catch (error) {
        console.warn("[WeatherMarkers] Feil ved fjerning av MapTiler-markør:", error);
    }

    safelyUnmountRootLater(entry.root);
}

export function renderWeatherMarkers({ map, markersRef, weatherPoints, onLocationClick }) {
    if (!map || !markersRef?.current) {
        return;
    }

    // Sørg for at vi alltid jobber med en Map
    if (!(markersRef.current instanceof Map)) {
        markersRef.current = new Map();
    }

    const existingMarkers = markersRef.current;
    const nextPointIds = new Set();

    if (!weatherPoints || weatherPoints.length === 0) {
        existingMarkers.forEach((entry) => {
            removeMarkerEntry(entry);
        });

        existingMarkers.clear();
        return;
    }

    // Opprett eller oppdater markører som skal være synlige
    weatherPoints.forEach((point) => {
        if (!point?.id) return;

        nextPointIds.add(point.id);

        const existingEntry = existingMarkers.get(point.id);

        if (existingEntry) {
            existingEntry.marker?.setLngLat([point.lon, point.lat]);

            if (existingEntry.container) {
                existingEntry.container.onclick = (event) => {
                    event.stopPropagation();
                    if (onLocationClick) {
                        onLocationClick(point);
                    }
                };
            }

            try {
                existingEntry.root.render(<WeatherSymbolLabel point={point} />);
            } catch (error) {
                console.warn("[WeatherMarkers] Feil ved re-render av eksisterende markør:", error);
            }

            existingEntry.point = point;
            return;
        }

        const container = document.createElement("div");
        container.className = "map-weather-marker-container";

        container.onclick = (event) => {
            event.stopPropagation();
            if (onLocationClick) {
                onLocationClick(point);
            }
        };

        const root = createRoot(container);
        root.render(<WeatherSymbolLabel point={point} />);

        const marker = new maptilersdk.Marker({
            element: container,
            anchor: "center"
        })
            .setLngLat([point.lon, point.lat])
            .addTo(map);

        existingMarkers.set(point.id, {
            marker,
            root,
            container,
            point
        });
    });

    // Fjern markører som ikke lenger finnes i weatherPoints
    existingMarkers.forEach((entry, pointId) => {
        if (nextPointIds.has(pointId)) return;

        removeMarkerEntry(entry);
        existingMarkers.delete(pointId);
    });
}