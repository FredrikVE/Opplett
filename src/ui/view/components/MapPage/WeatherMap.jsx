// src/ui/view/components/MapPage/WeatherMap.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

export default function WeatherMap({ apiKey, style, lat, lon, zoom }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    //UseEffekt som initialiserer oppretter karet én gang.
    useEffect(() => {
        if (!mapContainerRef.current || !apiKey || mapRef.current) {
			return;
		}

        if (lat == null || lon == null) {
			return;
		}

        maptilersdk.config.apiKey = apiKey;

        try {
            const map = new maptilersdk.Map({
                container: mapContainerRef.current,
                style: style,
                center: [Number(lon), Number(lat)],
                zoom: Number(zoom) || 6,
                attributionControl: false
            });

            mapRef.current = map;

            const resizeObserver = new ResizeObserver(() => {
                if (mapRef.current) map.resize();
            });
            resizeObserver.observe(mapContainerRef.current);

            return () => {
                resizeObserver.disconnect();
                if (mapRef.current) {
                    map.remove();
                    mapRef.current = null;
                }
            };
        } catch (error) {
            console.error("MapTiler Init Error:", error);
        }
    }, [apiKey, style]);

    //FlyTo effekt ved søk 
    useEffect(() => {
        const isReady = mapRef.current && lat != null && lon != null;
        if (!isReady) {
			return;
		}

        mapRef.current.flyTo({
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom) || 6,
            speed: 0.8,
            curve: 1.2,
            essential: true
        });
    }, [lat, lon, zoom]);

    return (
        <div className="map-page-wrap">
            {/* CSS bør sørge for at .map har høyde/bredde */}
            <div ref={mapContainerRef} className="map" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}