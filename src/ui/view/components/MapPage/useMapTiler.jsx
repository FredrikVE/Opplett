import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    // 1. Initialiser kartet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        console.log("[DEBUG 3] Initialiserer MapTiler SDK");
        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom),
            attributionControl: false,
        });

        // Trigger onMapChange med en gang kartet er klart for å låse opp ViewModel
        map.on("load", () => {
            console.log("[DEBUG 3] Kart lastet. Henter første BBOX.");
            const bounds = map.getBounds();
            const currentBbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ];
            onMapChange(lat, lon, currentBbox, map.getZoom());
        });

        map.on("moveend", () => {
            const center = map.getCenter();
            const bounds = map.getBounds();
            console.log("[DEBUG 3] moveend: Oppdaterer ViewModel med nytt utsnitt.");
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
                console.log("[DEBUG 3] Rydder opp kart-instans");
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);

    // 2. Tegn markører hver gang weatherPoints endres
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        console.log(`[DEBUG 3] weatherPoints endret. Mottok: ${weatherPoints?.length || 0} punkter.`);

        // Fjern gamle markører
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!weatherPoints || weatherPoints.length === 0) {
            console.log("[DEBUG 3] Ingen punkter å tegne.");
            return;
        }

        weatherPoints.forEach((point, idx) => {
            console.log(`[DEBUG 3] Lager markør #${idx}: ${point.name} (${point.temp}°)`);
            
            const el = document.createElement("div");
            el.className = "map-marker-wrapper";
            el.style.zIndex = "1000";

            // Bruk onclick her for enkelhets skyld
            el.onclick = () => {
                onLocationClick?.(point);
            };

            const root = createRoot(el);
            root.render(<WeatherSymbolLabel point={point} />);

            const marker = new maptilersdk.Marker({ element: el })
                .setLngLat([point.lon, point.lat])
                .addTo(map);
            
            markersRef.current.push(marker);
        });

        // Cleanup root ved unmount
        return () => {
            markersRef.current.forEach(m => m.remove());
        };
    }, [weatherPoints, onLocationClick]);

    // 3. Håndter flytting (bboxToFit fra søk)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (map && bboxToFit) {
            console.log("[DEBUG 3] Flytter kart til bboxToFit:", bboxToFit);
            map.fitBounds(bboxToFit, { padding: 40 });
        }
    }, [bboxToFit]);

    return mapContainerRef;
}