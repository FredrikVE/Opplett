// src/ui/view/components/MapPage/WeatherMap.jsx
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import "@maptiler/sdk/dist/maptiler-sdk.css";

// Utils
import { MAP_ANIMATION, MAP_MARKER_CONFIG, MAP_ZOOM_LEVELS } from "../../../utils/MapUtils/MapConfig.js";
import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());
    const lastMovedId = useRef(null);

    /* =========================
       STATUS RAPPORTERING
    ========================= */
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;

        if (!map || !map.isStyleLoaded() || !markerLayoutRef.current) {
            return;
        }

        //Oppdater MarkerLayout før vi henter punkter
        markerLayoutRef.current.update();

        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: activeAbstractMarkersRef.current,
            activeLocation
        });

        const center = map.getCenter();

        onMapChange(
            center.lat,
            center.lng,
            map.getBounds(),
            map.getZoom(),
            points
        );
    }, [onMapChange, activeLocation]);

    /* =========================
       INITIALISER KART
    ========================= */
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return;
        }

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [activeLocation?.lon ?? 0, activeLocation?.lat ?? 0],
            zoom: MAP_ZOOM_LEVELS.DISTRICT,
            attributionControl: false,
            navigationControl: true
        });

        map.on("load", () => {

            //Åpner label layers for alle zoomnivåer
            MAP_MARKER_CONFIG.LABEL_LAYERS.forEach(layer => {
                if (map.getLayer(layer)) {
                    map.setLayerZoomRange(layer, 0, 24);
                }
            });

            markerLayoutRef.current = new MarkerLayout(map, {
                layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
                max: MAP_MARKER_CONFIG.MAX_COUNT,
                sortingProperty: (f) => getFeaturePriorityScore(f)
            });

            reportMapStatus();
        });

        //Brukerbevegelser
        map.on("moveend", reportMapStatus);

        //Sørger for oppdatering etter zoom / label redraw
        map.on("idle", reportMapStatus);

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [apiKey, style, activeLocation, reportMapStatus]);

    /* =========================
       SYNKRONISER KAMERA
    ========================= */
    useEffect(() => {
        const map = mapInstanceRef.current;

        if (!map || !map.isStyleLoaded() || !mapTarget) {
            return;
        }

        if (lastMovedId.current === mapTarget.id) {
            return;
        }

        lastMovedId.current = mapTarget.id;

        if (mapTarget.type === "bounds") {
            map.fitBounds(mapTarget.data, {
                padding: mapTarget.isArea
                    ? MAP_ANIMATION.PADDING.AREA
                    : MAP_ANIMATION.PADDING.POINT,
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

    /* =========================
       HIGHLIGHT GEOMETRY
    ========================= */
    useEffect(() => {
        if (mapInstanceRef.current) {
            updateMapHighlight(mapInstanceRef.current, highlightGeometry);
        }
    }, [highlightGeometry]);

    /* =========================
       VÆR MARKERS
    ========================= */
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        renderWeatherMarkers({
            map: mapInstanceRef.current,
            markersRef,
            weatherPoints
        });
    }, [weatherPoints]);

    /* =========================
       RENDER
    ========================= */
    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}