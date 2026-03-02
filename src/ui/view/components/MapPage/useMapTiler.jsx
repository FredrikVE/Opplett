// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler({ apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick }) {

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    // 1. Initialisering av kartet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style,
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom),
            attributionControl: false
        });

        // Lytter på bevegelser for å synkronisere state tilbake til ViewModel
        map.on("moveend", () => {
            const center = map.getCenter();
            const bounds = map.getBounds();

            // Normaliserer Lng slik at den alltid er mellom -180 og 180 (fikser 400 Bad Request)
            const wrappedLng = center.lng.valueOf(); 
            const normalizedLng = ((wrappedLng + 180) % 360 + 360) % 360 - 180;

            onMapChange(
                center.lat,
                normalizedLng,
                [
                    bounds.getWest(),
                    bounds.getSouth(),
                    bounds.getEast(),
                    bounds.getNorth()
                ],
                map.getZoom()
            );
        });

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Håndtering av Bounding Box (Byer/Regioner)
    useEffect(() => {
        const map = mapInstanceRef.current;
        // Vi fjerner zoom fra avhengigheter for å unngå loop ved manuell zooming
        if (!map || !bboxToFit) return;

        map.fitBounds(
            [
                [bboxToFit[0], bboxToFit[1]],
                [bboxToFit[2], bboxToFit[3]]
            ],
            {
                padding: 60,
                duration: 1000,
                maxZoom: 12 
            }
        );

    }, [bboxToFit]); // Triggers kun når et nytt sted med grenser velges

    // 3. Programmatisk flytting (Land-søk / Reset / Enkeltpunkter)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;
        
        // Vi flyr bare hvis vi IKKE har en bounding box (unngår konflikt med useEffect #2)
        if (!bboxToFit) {
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });
        }

    }, [lat, lon, zoom, bboxToFit]);

    // 4. Oppdatering av værmarkører med klikk-støtte
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Rens gamle markører fra kartet og minnet
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        markersRef.current = weatherPoints.map(point => {
            const container = document.createElement("div");
            container.style.cursor = "pointer";
            
            // Klikkhåndtering for å navigere til værvarsel-siden
            container.onclick = (e) => {
                e.stopPropagation(); 
                if (onLocationClick) {
                    onLocationClick({
                        lat: point.lat,
                        lon: point.lon,
                        name: point.name || "Valgt fra kart",
                        timezone: point.timezone,
                        type: point.type,
                        bounds: point.bounds 
                    });
                }
            };

            const root = createRoot(container);
            root.render(<WeatherSymbolLabel point={point} />);

            const marker = new maptilersdk.Marker({ element: container })
                .setLngLat([point.lon, point.lat])
                .addTo(map);

            return marker;
        });

    }, [weatherPoints, onLocationClick]);

    return mapContainerRef;
}