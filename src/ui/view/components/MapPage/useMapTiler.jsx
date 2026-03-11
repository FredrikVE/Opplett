// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";

import { extractCityPoints } from "../../../utils/MapUtils/ExtractCityPoints.js";
import { updateMapHighlight } from "../../../utils/MapUtils/MapHighlight.js";
import { renderWeatherMarkers } from "../../../utils/MapUtils/WeatherMarkers.jsx";
import { getFeaturePriorityScore } from "../../../utils/MapUtils/MarkerLayoutUtils.js";

/**
 * Hjelpefunksjon for å beregne utsnitt (bounds) fra GeoJSON-geometri.
 * Gir mer nøyaktig sentrering enn standard bounding box fra API-et.
 */
const getBoundsFromGeometry = (geometry) => {
    if (!geometry || !geometry.features || geometry.features.length === 0) return null;

    let allPolygons = [];

    geometry.features.forEach(feature => {
        if (feature.geometry.type === "Polygon") {
            allPolygons.push(feature.geometry.coordinates[0]);
        } else if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach(poly => {
                allPolygons.push(poly[0]);
            });
        }
    });

    if (allPolygons.length === 0) return null;

    // Finn den største landmassen (proxy for fastlandet)
    const mainland = allPolygons.reduce((prev, current) => 
        (prev.length > current.length) ? prev : current
    );

    const coordsToUse = mainland.length > 10 ? mainland : allPolygons.flat();

    const lats = coordsToUse.map(c => c[1]);
    const lngs = coordsToUse.map(c => c[0]);

    return [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
    ];
};

export function useMapTiler(props) {
    const { 
        apiKey, style, lat, lon, zoom, 
        bboxToFit, weatherPoints, onMapChange, 
        activeLocation, highlightGeometry 
    } = props;

    // Konstanter for bevegelseslogikk
    const SIGNIFICANT_MOVE_THRESHOLD = 0.001;
    const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;
    
    const FIT_BOUNDS_PADDING = 50;
    const FIT_BOUNDS_MAX_ZOOM = 14;
    const FIT_BOUNDS_DURATION = 1500;

    // Refs for MapTiler instanser
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());

    // Kontroll-refs
    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);
    const activeLocationRef = useRef(activeLocation);

    // Oppdaterer ref til enhver tid for bruk i callbacks uten re-renders
    useEffect(() => {
        activeLocationRef.current = activeLocation;
    }, [activeLocation]);

    /**
     * Rapporterer kartets status (senter, zoom, synlige byer) tilbake til ViewModel.
     */
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

        // Henter ut byer som er synlige i tiles-laget akkurat nå
        const points = extractCityPoints({
            map,
            markerLayout: markerLayoutRef.current,
            activeMarkers: activeAbstractMarkersRef.current,
            activeLocation: activeLocationRef.current
        });

        onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
    }, [onMapChange]);

    // 1. Initialisering av kartet (Kjøres kun én gang)
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

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

        // Håndterer manglende ikoner i stilen for å unngå konsoll-støy
        map.on("styleimagemissing", (e) => {
            const id = e.id;
            const canvas = document.createElement("canvas");
            canvas.width = 1; canvas.height = 1;
            const context = canvas.getContext("2d");
            const emptyImageData = context.getImageData(0, 0, 1, 1);
            map.addImage(id, emptyImageData);
        });

        map.on("load", () => {
            const labelLayers = ["Capital city labels", "City labels", "Town labels", "Place labels"];
            labelLayers.forEach(layer => {
                if (map.getLayer(layer)) map.setLayerZoomRange(layer, 2, 24);
            });

            // Oppretter MarkerLayout for intelligent filtrering av bynavn
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
                    // Hvis vi har valgt et land, viser vi kun byer som tilhører det landet
                    if (currentLoc?.type === "country" && currentLoc?.countryCode) {
                        const tileCountryCode = props.iso_a2 || props.country_code;
                        if (tileCountryCode) return tileCountryCode.toLowerCase() === currentLoc.countryCode.toLowerCase();
                    }
                    return true;
                }
            });

            updateMapHighlight(map, highlightGeometry);
        });

        // Oppdaterer abstrakte markører under bevegelse for jevn animasjon
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

        // Bruker 'idle' med debounce for å rapportere status når kartet har stoppet helt
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style, reportMapStatus]);

    // 2. Synkronisering av blå highlight-grenser
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        updateMapHighlight(map, highlightGeometry);
    }, [highlightGeometry]);

    // 3. Synkronisering av Værmarkører ("Dumme" markører uten klikk-logikk)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Vi sender inn null for onLocationClick for å gjøre dem "dumme"
        renderWeatherMarkers({ 
            map, 
            markersRef, 
            weatherPoints, 
            onLocationClick: null 
        });
    }, [weatherPoints]);

    // 4. Synkronisering av kartutsnitt (FlyTo / FitBounds)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        // PRIORITET 1: Geometri-basert FitBounds (for land/regioner)
        const geometryBounds = getBoundsFromGeometry(highlightGeometry);
        
        if (geometryBounds) {
            isProgrammaticMove.current = true;
            map.fitBounds(geometryBounds, {
                padding: 80,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });
            return;
        }

        // PRIORITET 2: Standard Bounding Box fra søk
        if (bboxToFit) {
            isProgrammaticMove.current = true;
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });
            return;
        }

        // PRIORITET 3: Enkeltpunkt (FlyTo)
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
    }, [lat, lon, zoom, bboxToFit, highlightGeometry]);

    return mapContainerRef;
}