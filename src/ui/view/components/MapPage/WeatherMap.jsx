import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { MAP_ANIMATION, MAP_MARKER_CONFIG, MAP_ZOOM_LEVELS, MAP_CAMERA } from "../../../utils/MapUtils/MapConfig.js";
import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerLayoutRef = useRef(null);
    const markersRef = useRef([]);
    const lastMovedId = useRef(null);
    const isInternalMove = useRef(false);

    const reportMapStatus = useCallback((triggerSource) => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded() || !markerLayoutRef.current) return;

        // Hvis kartet flytter seg pga. mapTarget (søk/reset), venter vi til det er ferdig
        if (isInternalMove.current) {
            console.log(`[WeatherMap] 🤫 Ignorerer statusrapport under flytting (${triggerSource})`);
            return;
        }

        markerLayoutRef.current.update();
        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: new Map(),
            activeLocation
        });

        onMapChange(map.getCenter().lat, map.getCenter().lng, map.getBounds(), map.getZoom(), points);
    }, [onMapChange, activeLocation]);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        maptilersdk.config.apiKey = apiKey;
        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [activeLocation?.lon ?? 0, activeLocation?.lat ?? 0],
            zoom: MAP_ZOOM_LEVELS.DISTRICT,
            attributionControl: false,
        });

        map.on("load", () => {
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
                max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
                sortingProperty: getFeaturePriorityScore
            });
            reportMapStatus("MAP_LOAD");
        });

        // Viktig: Vi lytter på idle for å hente værpunkter når alt er i ro
        map.on("idle", () => {
            isInternalMove.current = false; // Flytting ferdig, nå kan vi rapportere
            reportMapStatus("EVENT_IDLE");
        });

        mapInstanceRef.current = map;
        return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
    }, [apiKey, style]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded() || !mapTarget) return;

        if (lastMovedId.current === mapTarget.id) return;

        console.log(`[WeatherMap] 🚀 Starter programmert flytt: ${mapTarget.id}`);
        lastMovedId.current = mapTarget.id;
        isInternalMove.current = true; // Lås rapportering til vi lander (idle)

        if (mapTarget.type === MAP_CAMERA.BOUNDS) {
            map.fitBounds(mapTarget.data, {
                padding: mapTarget.isArea ? MAP_ANIMATION.PADDING.AREA : MAP_ANIMATION.PADDING.POINT,
                duration: MAP_ANIMATION.DURATION_MS,
                essential: true
            });
        } else {
            map.flyTo({
                center: [mapTarget.data.lon, mapTarget.data.lat],
                zoom: mapTarget.data.zoom,
                speed: MAP_ANIMATION.FLY_SPEED,
                essential: true
            });
        }
    }, [mapTarget]);

    useEffect(() => {
        if (mapInstanceRef.current) updateMapHighlight(mapInstanceRef.current, highlightGeometry);
    }, [highlightGeometry]);

    useEffect(() => {
        if (mapInstanceRef.current) {
            renderWeatherMarkers({ map: mapInstanceRef.current, markersRef, weatherPoints });
        }
    }, [weatherPoints]);

    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}