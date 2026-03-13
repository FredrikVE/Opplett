//src/ui/utils/MapUtils/WeatherMarkers.jsx
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../../view/components/MapPage/WeatherSymbolLabel.jsx";

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
            try {
                entry.marker?.remove();
                entry.root?.unmount();
            } catch (error) {
                console.warn("[WeatherMarkers] Feil ved fjerning av markør:", error);
            }
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
            // Oppdater posisjon hvis markøren finnes fra før
            existingEntry.marker.setLngLat([point.lon, point.lat]);

            // Re-render komponent med nye data
            existingEntry.root.render(
                <WeatherSymbolLabel point={point} />
            );

            // Lagre siste point-data
            existingEntry.point = point;
            return;
        }

        // Opprett ny markør
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

        try {
            entry.marker?.remove();
            entry.root?.unmount();
        } catch (error) {
            console.warn("[WeatherMarkers] Feil ved opprydding av markør:", error);
        }

        existingMarkers.delete(pointId);
    });
}