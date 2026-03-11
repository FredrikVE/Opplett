import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";

import { MAP_ZOOM_LEVELS } from "../../../utils/MapUtils/MapZoomLevels.js";
import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";
import { getBoundsFromGeometry } from "../../../utils/MapUtils/MapBoundsHelper.js";

// --- KONSTANTER ---
const FLY_TO_SPEED = 1.2;
const ANIMATION_DURATION_MS = 1500;
const FIT_BOUNDS_PADDING_PX = 60;
const MAX_VISIBLE_MARKERS = 10; 
const MARKER_SIZE = [40, 70];
const MARKER_OFFSET = [0, -10];
const REPORT_IDLE_DELAY_MS = 300;

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, activeLocation, highlightGeometry } = props;

    /* =========================
       REFS & INTERNAL STATE
    ========================= */
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());

    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);
    const activeLocationRef = useRef(activeLocation);
    const lastProcessedLocationId = useRef(null);

    /* =========================
       COMMANDS (Handlinger)
    ========================= */
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded()) return;

        // Tving MarkerLayout til å oppdatere seg før vi henter punkter
        if (markerLayoutRef.current) {
            markerLayoutRef.current.update();
        }

        const center = map.getCenter();
        const bounds = map.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: activeAbstractMarkersRef.current,
            activeLocation: activeLocationRef.current
        });

        onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
    }, [onMapChange]);

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

            // SSOT-Fiks: Tving lagene til å eksistere fra verdensrommet (Zoom 0)
            labelLayers.forEach(layer => {
                if (map.getLayer(layer)) {
                    map.setLayerZoomRange(layer, 0, 24); 
                }
            });
            
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: labelLayers,
                markerSize: MARKER_SIZE,
                offset: MARKER_OFFSET,
                max: MAX_VISIBLE_MARKERS,
                sortingProperty: (feature) => getFeaturePriorityScore(feature),
                sortingOrder: "ascending"
            });

            reportMapStatus();
        });

        map.on("move", () => {
            if (!markerLayoutRef.current) return;
            activeAbstractMarkersRef.current.forEach(am => {
                markerLayoutRef.current.softUpdateAbstractMarker(am);
            });
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
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    };

    const onSynchronizeCamera = () => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        const currentLocationId = activeLocation?.id || `${lat},${lon}`;
        const hasNewContext = highlightGeometry || bboxToFit;
        if (lastProcessedLocationId.current === currentLocationId && !hasNewContext) return;
        
        lastProcessedLocationId.current = currentLocationId;
        isProgrammaticMove.current = true;

        const isArea = activeLocation?.type === "country" || activeLocation?.type === "region";
        const geometryBounds = getBoundsFromGeometry(highlightGeometry);

        if (geometryBounds) {
            // PRIORITET 1: Polygon-utsnitt (Tvinger Zoom 4 via SSOT)
            map.fitBounds(geometryBounds, {
                padding: isArea ? 80 : 40,
                minZoom: isArea ? MAP_ZOOM_LEVELS.COUNTRY : 2,
                maxZoom: isArea ? MAP_ZOOM_LEVELS.COUNTRY + 1 : MAP_ZOOM_LEVELS.DEFAULT,
                duration: ANIMATION_DURATION_MS
            });
        } 
        else if (bboxToFit) {

            // PRIORITET 2: Bounding Box
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING_PX,
                maxZoom: isArea ? MAP_ZOOM_LEVELS.COUNTRY : MAP_ZOOM_LEVELS.STREET,
                duration: ANIMATION_DURATION_MS
            });
        } 

        else {
            // PRIORITET 3: Enkeltpunkt
            map.flyTo({ 
                center: [lon, lat], 
                zoom: zoom, speed: 
                FLY_TO_SPEED, 
                essential: true 
            });
        }
    };

    const onUpdateHighlight = () => {
        if (mapInstanceRef.current) {
            updateMapHighlight(mapInstanceRef.current, highlightGeometry);
        }
    };

    const onRenderMarkers = () => {
        if (mapInstanceRef.current) {
            renderWeatherMarkers({ 
                map: mapInstanceRef.current, 
                markersRef, 
                weatherPoints, 
                onLocationClick: null 
            });
        }
    };

    const syncActiveLocationRef = () => {
        activeLocationRef.current = activeLocation;
    };


    /* =========================
       EFFECT TRIGGERS (Nederst)
    ========================= */

    //Initialisering: [] sikrer at kartet lages én gang og aldri blinker
    //eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(onInitializeMap, []); 

    //Oppdater intern ref uten re-render
    useEffect(syncActiveLocationRef, [activeLocation]);

    //Kamera-navigering
    useEffect(onSynchronizeCamera, [lat, lon, zoom, bboxToFit, highlightGeometry, activeLocation]);

    //Blå grenser
    useEffect(onUpdateHighlight, [highlightGeometry]);

    //Værikoner
    useEffect(onRenderMarkers, [weatherPoints]);

    /* =========================
       PUBLIC API
    ========================= */
    return mapContainerRef;
}