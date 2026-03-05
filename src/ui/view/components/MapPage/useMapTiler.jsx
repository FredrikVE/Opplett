import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const isProgrammaticMove = useRef(false);

    // 1. Initialiser kartet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom),
            attributionControl: false,
        });

        map.on("load", () => {
            const bounds = map.getBounds();
            onMapChange(lat, lon, [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], map.getZoom());
        });

        map.on("moveend", () => {
            // Hvis flyttingen ble trigget av koden (søkeresultat), ikke send oppdatering tilbake til VM
            // Dette hindrer "shaking" eller at kartet hopper tilbake
            if (isProgrammaticMove.current) {
                isProgrammaticMove.current = false;
                return;
            }

            const center = map.getCenter();
            const bounds = map.getBounds();
            onMapChange(
                center.lat,
                center.lng,
                [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
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
    }, [apiKey, style]);

    // 2. Markør-logikken (Beholdes som den er siden den fungerer)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!weatherPoints || weatherPoints.length === 0) return;

        weatherPoints.forEach((point) => {
            const el = document.createElement("div");
            el.className = "map-marker-wrapper";
            el.style.zIndex = "1000";
            el.onclick = () => onLocationClick?.(point);

            const root = createRoot(el);
            root.render(<WeatherSymbolLabel point={point} />);

            const marker = new maptilersdk.Marker({ element: el })
                .setLngLat([point.lon, point.lat])
                .addTo(map);
            
            markersRef.current.push(marker);
        });
    }, [weatherPoints, onLocationClick]);

    // 3. SMART FLYTTING: Håndterer både BBOX (Regioner) og Lat/Lon (Byer/Land)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // PRIORITET 1: Bounding Box (Brukes for fylker, kommuner osv.)
        if (bboxToFit) {
            isProgrammaticMove.current = true;
            map.fitBounds(bboxToFit, { 
                padding: 50, 
                maxZoom: 14, 
                duration: 1500 
            });
            return; // Avbryt så vi ikke kjører flyTo rett etterpå
        }

        // PRIORITET 2: Punkt-flytting (Brukes for Land, Kontinent eller spesifikke steder uten bounds)
        const center = map.getCenter();
        const hasMovedSignificantly = 
            Math.abs(center.lat - lat) > 0.01 || 
            Math.abs(center.lng - lon) > 0.01 ||
            Math.abs(map.getZoom() - zoom) > 0.1;

        if (hasMovedSignificantly) {
            isProgrammaticMove.current = true;
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                curve: 1.4,
                essential: true
            });
        }
    }, [lat, lon, zoom, bboxToFit]);

    return mapContainerRef;
}