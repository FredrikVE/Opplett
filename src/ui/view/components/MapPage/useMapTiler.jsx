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
const MAX_VISIBLE_MARKERS = 20;
const MARKER_SIZE = [40, 70];
const MARKER_OFFSET = [0, -10];
const REPORT_IDLE_DELAY_MS = 300;

export function useMapTiler(props) {
    const { 
        apiKey, style, lat, lon, zoom, 
        bboxToFit, weatherPoints, onMapChange, 
        activeLocation, highlightGeometry 
    } = props;

    // Refs for MapTiler-instanser
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());

    // Kontroll-refs
    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);
    const activeLocationRef = useRef(activeLocation);
    const lastProcessedLocationId = useRef(null);

    // Hold ref oppdatert for bruk i callbacks uten re-renders
    useEffect(() => {
        activeLocationRef.current = activeLocation;
    }, [activeLocation]);

    /**
     * Rapporterer kartets status (senter, zoom, synlige byer) tilbake til systemet.
     */
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

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

    // 1. Initialisering (Kjøres kun ved oppstart eller stilbytte)
    useEffect(() => {
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
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: labelLayers,
                markerSize: MARKER_SIZE,
                offset: MARKER_OFFSET,
                max: MAX_VISIBLE_MARKERS,
                sortingProperty: (feature) => getFeaturePriorityScore(feature),
                sortingOrder: "ascending"
            });
        });

        map.on("move", () => {
            if (!markerLayoutRef.current) return;
            activeAbstractMarkersRef.current.forEach(am => {
                markerLayoutRef.current.softUpdateAbstractMarker(am);
            });
        });

        map.on("moveend", () => { isProgrammaticMove.current = false; });

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style, reportMapStatus]);

    // 2. Bevegelse (FlyTo / FitBounds)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        // Bruk ID eller koordinater som unik nøkkel for å unngå "fighting" med manuell zoom
        const currentLocationId = activeLocation?.id || `${lat},${lon}`;
        
        // Tillat re-run hvis vi har fått ny geometri/bbox, selv om ID er lik
        const hasNewContext = highlightGeometry || bboxToFit;
        if (lastProcessedLocationId.current === currentLocationId && !hasNewContext) return;
        
        lastProcessedLocationId.current = currentLocationId;
        isProgrammaticMove.current = true;

        const isCountry = activeLocation?.type === "country" || 
                         activeLocation?.name?.toLowerCase() === "norge" ||
                         activeLocation?.name?.toLowerCase() === "usa";

        // PRIORITET 1: Bounding Box fra søkeresultat (Fikser USA/Danmark umiddelbart)
        if (bboxToFit) {
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING_PX,
                maxZoom: isCountry ? MAP_ZOOM_LEVELS.COUNTRY : MAP_ZOOM_LEVELS.STREET,
                duration: ANIMATION_DURATION_MS
            });
        } 
        // PRIORITET 2: Geometri fra Polygon-oppslag (Nøyaktig highlight-utsnitt)
        else if (highlightGeometry) {
            const SW_NE = getBoundsFromGeometry(highlightGeometry);
            if (SW_NE) {
                map.fitBounds(SW_NE, {
                    padding: FIT_BOUNDS_PADDING_PX,
                    maxZoom: isCountry ? MAP_ZOOM_LEVELS.COUNTRY : MAP_ZOOM_LEVELS.DEFAULT,
                    duration: ANIMATION_DURATION_MS
                });
            }
        } 
        // PRIORITET 3: Fallback til punkt-navigering
        else {
            map.flyTo({
                center: [lon, lat],
                zoom: zoom, 
                speed: FLY_TO_SPEED,
                essential: true
            });
        }
    }, [lat, lon, zoom, bboxToFit, highlightGeometry, activeLocation]);

    // 3. Highlight og Markører
    useEffect(() => {
        if (mapInstanceRef.current) {
            updateMapHighlight(mapInstanceRef.current, highlightGeometry);
        }
    }, [highlightGeometry]);

    useEffect(() => {
        if (mapInstanceRef.current) {
            renderWeatherMarkers({ 
                map: mapInstanceRef.current, 
                markersRef, 
                weatherPoints, 
                onLocationClick: null 
            });
        }
    }, [weatherPoints]);

    return mapContainerRef;
}