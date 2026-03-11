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

// --- KONSTANTER ---
const FLY_TO_SPEED = 1.2;
const ANIMATION_DURATION_MS = 1500;
const FIT_BOUNDS_PADDING_PX = 60;
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
    const lastProcessedActionKey = useRef(null);

    /* =========================
       COMMANDS (Handlinger)
    ========================= */

    // Rapporterer kartets nåværende status tilbake til ViewModel
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded()) return;

        // Oppdater MarkerLayout før vi trekker ut punkter
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

    // Initialiserer selve kart-instansen
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

            // Tving lagene til å eksistere fra verdensrommet for SSOT-filtrering
            labelLayers.forEach(layer => {
                if (map.getLayer(layer)) {
                    map.setLayerZoomRange(layer, 0, 24); 
                }
            });
            
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: labelLayers,
                markerSize: MARKER_SIZE,
                offset: MARKER_OFFSET,
                // Vi setter max høyt her for å gi ExtractCityPoints nok rådata å filtrere på
                max: 40, 
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
                // Sikker rydding av markører ved unmount
                const currentMarkers = [...markersRef.current];
                setTimeout(() => {
                    currentMarkers.forEach(m => m.root?.unmount());
                }, 0);
                
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    };

    // Synkroniserer kamera basert på SSOT-instrukser (ActionKey)
    const onSynchronizeCamera = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // VAKTPOST: Lager en unik nøkkel for å unngå zooming-krig
        const geoId = highlightGeometry ? (highlightGeometry.id || 'current-geo') : 'none';
        const actionKey = `${activeLocation?.id}-${bboxToFit ? 'bbox' : 'no-bbox'}-${geoId}`;

        // Hvis vi allerede har flyttet oss til dette målet, gjør ingenting
        if (lastProcessedActionKey.current === actionKey) return;
        
        lastProcessedActionKey.current = actionKey;
        isProgrammaticMove.current = true;

        const isArea = activeLocation?.type === "country" || activeLocation?.type === "region";
        const geometryBounds = getBoundsFromGeometry(highlightGeometry);

        if (geometryBounds) {
            // PRIORITET 1: Geometri-utsnitt (Land/Region)
            map.fitBounds(geometryBounds, {
                padding: isArea ? 80 : 40,
                duration: ANIMATION_DURATION_MS,
                essential: true // Lar brukeren avbryte/zoome fritt etterpå
            });
        } 
        else if (bboxToFit) {
            // PRIORITET 2: Spesifikk Bounding Box fra søk
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING_PX,
                duration: ANIMATION_DURATION_MS
            });
        } 
        else {
            // PRIORITET 3: Enkeltpunkt (FlyTo)
            map.flyTo({ 
                center: [lon, lat], 
                zoom: zoom, 
                speed: FLY_TO_SPEED, 
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
       EFFECT TRIGGERS
    ========================= */

    // Initialisering: Skjer kun én gang
    useEffect(onInitializeMap, []); 

    // Oppdater intern ref uten å trigge re-renders
    useEffect(syncActiveLocationRef, [activeLocation]);

    // Kamera-kontroll: Lytter på ID og spesifikke handlinger (ikke rå lat/lon)
    useEffect(onSynchronizeCamera, [activeLocation?.id, bboxToFit, highlightGeometry]);

    // Blå grenser
    useEffect(onUpdateHighlight, [highlightGeometry]);

    // Værikoner (Markører)
    useEffect(onRenderMarkers, [weatherPoints]);

    return mapContainerRef;
}