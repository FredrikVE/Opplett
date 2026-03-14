import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { MAP_ANIMATION, MAP_MARKER_CONFIG, MAP_ZOOM_LEVELS, MAP_CAMERA } from "../../../utils/MapUtils/MapConfig.js";

import { extractCityPointsFromMarkers } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { syncMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { syncAbstractMarkersFromLayout, getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

export default function WeatherMap({ apiKey, style, mapTarget, weatherPoints, onMapChange, activeLocation, highlightGeometry }) {

    /* =========================================================
       REFS
    ========================================================= */

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    const markerLayoutRef = useRef(null);
    const layoutMarkersRef = useRef(new Map());
    const weatherMarkersRef = useRef(new Map());

    const lastMoveIdRef = useRef(null);
    const internalMoveRef = useRef(false);
    const idleTimerRef = useRef(null);

    const reportMapStatusRef = useRef(null);

    /* =========================================================
       HELPERS
    ========================================================= */

    const buildViewport = (map) => ({
        lat: map.getCenter().lat,
        lon: map.getCenter().lng,
        zoom: map.getZoom(),
        bounds: map.getBounds().toArray()
    });

    const collectVisiblePoints = (map) => {

        const layout = markerLayoutRef.current;
        if (!layout) return [];

        const abstractMarkers = syncAbstractMarkersFromLayout(
            layout,
            layoutMarkersRef.current
        );

        return extractCityPointsFromMarkers({
            abstractMarkers,
            zoom: map.getZoom(),
            activeLocation
        });
    };

    const reportMapStatus = (source = "UNKNOWN") => {

        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        if (internalMoveRef.current) return;

        const points = collectVisiblePoints(map);

        onMapChange({
            viewport: buildViewport(map),
            points
        });

        console.log(`[WeatherMap] ${source} -> ${points.length} punkter`);
    };

    reportMapStatusRef.current = reportMapStatus;

    /* =========================================================
       MAP INIT
    ========================================================= */

    useEffect(() => {

        if (!mapContainerRef.current || mapRef.current) return;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style,

            center: [
                mapTarget?.data?.lon ?? activeLocation?.lon ?? 10,
                mapTarget?.data?.lat ?? activeLocation?.lat ?? 60
            ],

            zoom: mapTarget?.data?.zoom ?? MAP_ZOOM_LEVELS.COUNTRY,

            attributionControl: false,
            navigationControl: true,
            geolocateControl: false
        });

        map.on("load", () => {

            const minZoom = MAP_MARKER_CONFIG.LABEL_LAYER_ZOOM_RANGE.MIN;
            const maxZoom = MAP_MARKER_CONFIG.LABEL_LAYER_ZOOM_RANGE.MAX;

            MAP_MARKER_CONFIG.LABEL_LAYERS.forEach((layerId) => {
                if (map.getLayer(layerId)) {
                    map.setLayerZoomRange(layerId, minZoom, maxZoom);
                }
            });

            markerLayoutRef.current = new MarkerLayout(map, {
                layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
                markerSize: [40, 70],
                offset: [0, -10],
                markerAnchor: "center",
                max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
                sortingProperty: getFeaturePriorityScore,
                /*
				sortingOrder: "ascending",

                filter: (feature) => {
                    const cls = feature?.properties?.class;
                    return ["city", "town", "village"].includes(cls);
                }
					*/
            });

            requestAnimationFrame(() => {
                reportMapStatusRef.current?.("MAP_LOAD");
            });

        });

        map.on("move", () => {

            const layout = markerLayoutRef.current;
            if (!layout) return;

            layoutMarkersRef.current.forEach((marker, id) => {
                layout.softUpdateAbstractMarker(marker);
                layoutMarkersRef.current.set(id, marker);
            });

        });

        map.on("idle", () => {

            internalMoveRef.current = false;

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }

            idleTimerRef.current = setTimeout(() => {

                requestAnimationFrame(() => {
                    reportMapStatusRef.current?.("EVENT_IDLE");
                });

            }, MAP_MARKER_CONFIG.IDLE_REPORT_DEBOUNCE_MS);

        });

        mapRef.current = map;

        const layoutMarkers = layoutMarkersRef.current;
        const weatherMarkers = weatherMarkersRef.current;

        return () => {

            markerLayoutRef.current = null;

            layoutMarkers.clear();

            weatherMarkers.forEach((entry) => {
                entry.marker?.remove();
                entry.root?.unmount?.();
            });

            weatherMarkers.clear();

            map.remove();
            mapRef.current = null;

        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);

    /* =========================================================
       MAP MOVEMENT
    ========================================================= */

    useEffect(() => {

        const map = mapRef.current;

        if (!map || !mapTarget || !map.isStyleLoaded()) return;

        if (lastMoveIdRef.current === mapTarget.id) return;

        lastMoveIdRef.current = mapTarget.id;
        internalMoveRef.current = true;

        console.log(`[WeatherMap] flytter kart → ${mapTarget.id}`);

        if (mapTarget.type === MAP_CAMERA.BOUNDS) {

            map.fitBounds(mapTarget.data, {
                padding: mapTarget.isArea
                    ? MAP_ANIMATION.PADDING.AREA
                    : MAP_ANIMATION.PADDING.POINT,
                duration: MAP_ANIMATION.DURATION_MS,
                essential: true
            });

            return;
        }

        map.flyTo({
            center: [mapTarget.data.lon, mapTarget.data.lat],
            zoom: mapTarget.data.zoom,
            speed: MAP_ANIMATION.FLY_SPEED,
            essential: true
        });

    }, [mapTarget]);

    /* =========================================================
       HIGHLIGHT
    ========================================================= */

    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        syncMapHighlight(map, highlightGeometry);

    }, [highlightGeometry]);

    /* =========================================================
       WEATHER MARKERS
    ========================================================= */

    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        renderWeatherMarkers({
            map,
            markersRef: weatherMarkersRef,
            weatherPoints
        });

    }, [weatherPoints]);

    /* =========================================================
       VIEW
    ========================================================= */

    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}