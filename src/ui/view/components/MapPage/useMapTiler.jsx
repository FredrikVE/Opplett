import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler({ apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange }) {

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

        map.on("moveend", () => {
            const center = map.getCenter();
            const bounds = map.getBounds();

            // Normaliserer Lng slik at den alltid er mellom -180 og 180
            // Dette fikser 400 Bad Request når man panorerer rundt jorda.
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
        // Vi hopper over fitBounds hvis zoom er 3 (land-søk) for å unngå loop
        if (!map || !bboxToFit || zoom === 3) return;

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

    }, [bboxToFit, zoom]);

    // 3. Programmatisk flytting (Land-søk / Reset)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;
        
        if (!bboxToFit) {
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });
        }

    }, [lat, lon, zoom, bboxToFit]);

    // 4. Oppdatering av værmarkører
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        markersRef.current = weatherPoints.map(point => {
            const container = document.createElement("div");
            const root = createRoot(container);
            root.render(<WeatherSymbolLabel point={point} />);

            return new maptilersdk.Marker({ element: container })
                .setLngLat([point.lon, point.lat])
                .addTo(map);
        });

    }, [weatherPoints]);

    return mapContainerRef;
}