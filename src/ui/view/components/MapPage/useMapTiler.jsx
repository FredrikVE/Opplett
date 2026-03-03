//src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    
    //En vaktpost for å hindre uendelige løkker mellom kartet og state
    const isProgrammaticMove = useRef(false);

    //Initialisering av kart én gang
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return;
        }

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style,
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom),
            attributionControl: false
        });

        map.on("moveend", () => {
            //Hvis det var vi som flyttet kartet programmatisk, 
            //trenger vi ikke rapportere endringen tilbake som en "ny" lokasjon.
            if (isProgrammaticMove.current) {
                isProgrammaticMove.current = false;
                return;
            }

            const center = map.getCenter();
            const bounds = map.getBounds();
            const wrappedLng = center.lng.valueOf();
            const normalizedLng = ((wrappedLng + 180) % 360 + 360) % 360 - 180;

            onMapChange(
                center.lat,
                normalizedLng,
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
    }, []);

    //HÅNDTERING AV BOUNDING BOX (BYER/REGIONER)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !bboxToFit) {
            return;
        }

        isProgrammaticMove.current = true;
        map.fitBounds(
            [[bboxToFit[0], bboxToFit[1]], [bboxToFit[2], bboxToFit[3]]],
            { padding: 60, duration: 1000, maxZoom: 12 }
        );
    }, [bboxToFit]);

    // 3. PROGRAMMATISK FLYTTING (SØK / RESET)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null || bboxToFit) {
            return;
        }

        const center = map.getCenter();
        const currentLat = center.lat;
        const currentLon = ((center.lng + 180) % 360 + 360) % 360 - 180;

        //Vi flyr kun hvis avviket er merkbart (f.eks. nytt søk)
        const threshold = 0.001; 
        const hasMovedSignificantly = 
            Math.abs(currentLat - lat) > threshold || 
            Math.abs(currentLon - lon) > threshold;

        if (hasMovedSignificantly) {
            isProgrammaticMove.current = true;
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });
        }
    }, 
    [lat, lon, zoom, bboxToFit]);

    // 4. VÆRMARKØRER
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) {
            return;
        }

        // Rydd opp eksisterende markører
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Tegn nye
        markersRef.current = weatherPoints.map(point => {
            const container = document.createElement("div");
            container.className = "map-marker-wrapper";
            
            container.onclick = (event) => {

                event.stopPropagation();

                if (onLocationClick) {
                    // Her sender vi med hele lokasjonsobjektet slik at App.jsx kan sette manualLocation
                    onLocationClick({
                        lat: point.lat,
                        lon: point.lon,
                        name: point.name,
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

    }, 
    [weatherPoints, onLocationClick]);

    return mapContainerRef;
}