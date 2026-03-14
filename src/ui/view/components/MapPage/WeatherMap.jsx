//src/ui/view/components/MapPage/WeatherMap.jsx
import { useRef, useCallback, useEffect } from "react";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { useMapTilerInit } from "./hooks/useMapTilerInit.js";
import { useMapCamera } from "./hooks/useMapCamera";
import { useMapMarkerLayout } from "./hooks/useMapMarkerLayout";
import { useWeatherMarkers } from "./hooks/useWeatherMarkers";
import { syncMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {
    const mapContainerRef = useRef(null);

    //Initialiser kartet (SSOT for kart-instansen)
    const map = useMapTilerInit(mapContainerRef, apiKey, style, mapTarget, activeLocation);

    //Deklarativ styring av kartets kamera
    useMapCamera(map, mapTarget);

    //Synkroniser Highlight (Kjøres automatisk når geometri eller kart oppdateres)
    useEffect(() => {
        if (map && highlightGeometry) {
            syncMapHighlight(map, highlightGeometry);
        }
    }, [map, highlightGeometry]);

    //Håndter MapTilers MarkerLayout og rapporter synlige byer oppover
    const handleVisiblePointsChange = useCallback((points) => {
        if (!map) {
            return;
        }
        
        onMapChange({
            viewport: {
                lat: map.getCenter().lat,
                lon: map.getCenter().lng,
                zoom: map.getZoom(),
                bounds: map.getBounds().toArray()
            },
            points
        });
    }, [map, onMapChange]);

    useMapMarkerLayout(map, activeLocation, handleVisiblePointsChange);

    //Tegn vær-ikoner basert på prop
    useWeatherMarkers(map, weatherPoints);

    // =========================================================
    // VIEW
    // =========================================================
    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}