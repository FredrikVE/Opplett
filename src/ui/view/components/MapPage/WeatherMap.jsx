import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { GeocodingControl } from "@maptiler/geocoding-control/react";

import "@maptiler/sdk/dist/maptiler-sdk.css";
import "@maptiler/geocoding-control/style.css";

export default function WeatherMap({ apiKey, style, lat, lon, zoom }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);

    // Initialisering (Kjører kun én gang)
    useEffect(() => {
        if (!mapContainerRef.current || !apiKey || mapRef.current) return;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: maptilersdk.MapStyle[style] ?? maptilersdk.MapStyle.STREETS,
            center: [lon || 10.75, lat || 59.91],
            zoom: zoom || 6
        });

        map.on('load', () => {
            mapRef.current = map;
            setMapInstance(map);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [apiKey, lat, lon, style, zoom]); // Kun ved endring av API-nøkkel

    // Flytt kartet når props (lat/lon) endres fra utsiden (f.eks. søkefeltet ditt)
    useEffect(() => {
        if (!mapRef.current || lat == null || lon == null) return;
        
        mapRef.current.flyTo({
            center: [lon, lat],
            zoom: zoom,
            essential: true
        });
    }, [lat, lon, zoom]);

    return (
        <div className="map-page-wrap">
            {/* Dette er DIV-en som MÅ ha høyde i CSS */}
            <div ref={mapContainerRef} className="map" />

            {mapInstance && (
                <div className="geocoding">
                    <GeocodingControl
                        apiKey={apiKey}
                        map={mapInstance}
                        marker={true}
                        showResultsWhileTyping={true}
                        placeholder="Søk på kartet..."
                    />
                </div>
            )}
        </div>
    );
}