//src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";

import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick, activeLocation, highlightGeometry } = props;

    const SIGNIFICANT_MOVE_THRESHOLD = 0.001;
    const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;
    
    const FIT_BOUNDS_PADDING = 50;
    const FIT_BOUNDS_MAX_ZOOM = 14;
    const FIT_BOUNDS_DURATION = 1500;

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());

    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);

    const activeLocationRef = useRef(activeLocation);

    useEffect(() => {
        activeLocationRef.current = activeLocation;
    }, [activeLocation]);

    // Pakker inn reportMapStatus i useCallback så den kan brukes trygt i useEffect
    const reportMapStatus = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const center = map.getCenter();
        const bounds = map.getBounds();
        const bbox = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
        ];

        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: activeAbstractMarkersRef.current,
            activeLocation: activeLocationRef.current
        });

        onMapChange(
            center.lat,
            center.lng,
            bbox,
            map.getZoom(),
            points
        );
    }, [onMapChange]);

    // 1. Initialisering av kartet
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return;
        }

        // Kopierer refs til lokale variabler for sikker cleanup (løser ESLint feil)
        const currentMarkers = markersRef.current;
        const currentAbstractMarkers = activeAbstractMarkersRef.current;

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon || 0), Number(lat || 0)],
            zoom: Number(zoom || 12),
            attributionControl: false,
            navigationControl: true,
            geolocateControl: false
        });

        map.on("styleimagemissing", (e) => {
            const id = e.id;
            const canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;
            const context = canvas.getContext("2d");
            const emptyImageData = context.getImageData(0, 0, 1, 1);
            map.addImage(id, emptyImageData);
        });

        map.on("load", () => {
            const labelLayers = [
                "Capital city labels",
                "City labels",
                "Town labels",
                "Place labels"
            ];

            labelLayers.forEach(layer => {
                if (map.getLayer(layer)) {
                    map.setLayerZoomRange(layer, 2, 24);
                }
            });

            markerLayoutRef.current = new MarkerLayout(map, {
                layers: labelLayers,
                markerSize: [40, 70],
                offset: [0, -10],
                markerAnchor: "center",
                max: 30,
                sortingProperty: (feature) => getFeaturePriorityScore(feature),
                sortingOrder: "ascending",
                filter: (feature) => {
                    const props = feature.properties || {};
                    const currentLoc = activeLocationRef.current;
                    if (currentLoc?.type === "country" && currentLoc?.countryCode) {
                        const tileCountryCode = props.iso_a2 || props.country_code;
                        if (tileCountryCode) return tileCountryCode.toLowerCase() === currentLoc.countryCode.toLowerCase();
                    }
                    return true;
                }
            });

            // Tegn highlight umiddelbart hvis det finnes
            updateMapHighlight(map, highlightGeometry);
        });

        map.on("move", () => {
            const markerLayout = markerLayoutRef.current;
            if (!markerLayout) return;

            currentAbstractMarkers.forEach((abstractMarker, id) => {
                markerLayout.softUpdateAbstractMarker(abstractMarker);
                currentAbstractMarkers.set(id, abstractMarker);
            });
        });

        map.on("moveend", () => { 
            isProgrammaticMove.current = false; 
        });

        map.on("idle", () => {
            if (isProgrammaticMove.current) return;
            clearTimeout(idleDebounceRef.current);
            idleDebounceRef.current = setTimeout(reportMapStatus, 300);
        });

        mapInstanceRef.current = map;

        return () => {
            currentMarkers.forEach(m => m.remove());
            currentAbstractMarkers.clear();

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // Bruker eslint-disable for lat/lon/zoom her fordi vi ikke vil re-initialisere kartet 
        // hver gang brukeren panorerer, kun når API-nøkkel eller stil endres.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style, reportMapStatus]);

    // 2. Synkronisering av Highlight
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        updateMapHighlight(map, highlightGeometry);
    }, [highlightGeometry]);

    // 3. Synkronisering av Værmarkører
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        renderWeatherMarkers({
            map,
            markersRef,
            weatherPoints,
            onLocationClick
        });
    }, [weatherPoints, onLocationClick]);

    // 4. Synkronisering av FlyTo / FitBounds
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        if (bboxToFit) {
            isProgrammaticMove.current = true;
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });
            return;
        }

        const center = map.getCenter();
        const currentZoom = map.getZoom();

        const hasMoved = 
            Math.abs(center.lat - lat) > SIGNIFICANT_MOVE_THRESHOLD ||
            Math.abs(center.lng - lon) > SIGNIFICANT_MOVE_THRESHOLD ||
            Math.abs(currentZoom - zoom) > SIGNIFICANT_ZOOM_THRESHOLD;

        if (hasMoved) {
            isProgrammaticMove.current = true;
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });
        }
    }, [lat, lon, zoom, bboxToFit]);

    return mapContainerRef;
}