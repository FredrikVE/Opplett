// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";

import { MAP_ZOOM_LEVELS } from "../../../utils/MapUtils/MapConfig.js";
import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";
import { getBoundsFromGeometry } from "../../../utils/MapUtils/MapBoundsHelper.js";

const FLY_TO_SPEED = 1.2;
const ANIMATION_DURATION_MS = 1500;
const FIT_BOUNDS_PADDING_PX = 60;
const MARKER_SIZE = [40, 70];
const MARKER_OFFSET = [0, -10];
const REPORT_IDLE_DELAY_MS = 300;

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, activeLocation, highlightGeometry } = props;

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());

    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);
    
    // SSOT: Vi bruker denne til å vite nøyaktig hva kartet "viser" for øyeblikket
    // slik at vi bare flytter oss når ViewModel ber om noe NYTT.
    const lastCommandKey = useRef("");

    /* =========================
       COMMANDS (Handlinger)
    ========================= */
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded()) return;

        if (markerLayoutRef.current) markerLayoutRef.current.update();

        const center = map.getCenter();
        const bounds = map.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: activeAbstractMarkersRef.current,
            activeLocation
        });

        onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
    }, [onMapChange, activeLocation]);

    const onInitializeMap = () => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon || 0), Number(lat || 0)],
            zoom: Number(zoom || MAP_ZOOM_LEVELS.DEFAULT),
            attributionControl: false,
            navigationControl: true
        });

        map.on("load", () => {
            const labelLayers = ["Capital city labels", "City labels", "Town labels", "Place labels"];
            labelLayers.forEach(layer => {
                if (map.getLayer(layer)) map.setLayerZoomRange(layer, 0, 24); 
            });
            
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: labelLayers,
                markerSize: MARKER_SIZE,
                offset: MARKER_OFFSET,
                max: 40, 
                sortingProperty: (f) => getFeaturePriorityScore(f),
                sortingOrder: "ascending"
            });
            reportMapStatus();
        });

        map.on("moveend", () => { 
            isProgrammaticMove.current = false; 
            reportMapStatus();
        });

        map.on("idle", () => {
            if (isProgrammaticMove.current) return;
            clearTimeout(idleDebounceRef.current);
            idleDebounceRef.current = setTimeout(reportMapStatus, REPORT_IDLE_DELAY_MS);
        });

        mapInstanceRef.current = map;
        return () => {
            if (mapInstanceRef.current) {
                const currentMarkers = [...markersRef.current];
                setTimeout(() => currentMarkers.forEach(m => m.root?.unmount()), 0);
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    };

    const onSynchronizeCamera = () => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded()) return;

        // LAG EN UNIK NØKKEL basert på destinasjonen
        // Hvis denne er uendret, betyr det at React-re-render skyldes noe annet enn et nytt søk.
        const geoId = highlightGeometry ? "geo" : "no-geo";
        const currentCommandKey = `${activeLocation?.id}-${zoom}-${bboxToFit ? "bbox" : "none"}-${geoId}`;

        if (lastCommandKey.current === currentCommandKey) return;
        
        lastCommandKey.current = currentCommandKey;
        isProgrammaticMove.current = true;

        const isArea = activeLocation?.type === "country" || activeLocation?.type === "region";
        const geometryBounds = getBoundsFromGeometry(highlightGeometry);

        // UTFØR FLYTTING
        if (geometryBounds) {
            map.fitBounds(geometryBounds, {
                padding: isArea ? 80 : 40,
                duration: ANIMATION_DURATION_MS,
                essential: true 
            });
        } 
        else if (bboxToFit) {
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING_PX,
                duration: ANIMATION_DURATION_MS
            });
        } 
        else {
            map.flyTo({ 
                center: [lon, lat], 
                zoom: zoom, 
                speed: FLY_TO_SPEED, 
                essential: true 
            });
        }
    };

    /* =========================
       EFFECT TRIGGERS
    ========================= */
    useEffect(onInitializeMap, []); 

    // Denne lytter nå på ALT som definerer et "hopp" på kartet
    useEffect(onSynchronizeCamera, [activeLocation?.id, zoom, bboxToFit, highlightGeometry, lat, lon]);

    useEffect(() => {
        if (mapInstanceRef.current) updateMapHighlight(mapInstanceRef.current, highlightGeometry);
    }, [highlightGeometry]);

    useEffect(() => {
        if (mapInstanceRef.current) {
            renderWeatherMarkers({ 
                map: mapInstanceRef.current, 
                markersRef, 
                weatherPoints 
            });
        }
    }, [weatherPoints]);

    return mapContainerRef;
}