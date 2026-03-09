// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";
import { calculateWeatherIconSpread } from "../../../utils/MapUtils/MapWeatherIconSpread.js";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const isProgrammaticMove = useRef(false);

    // Konstanter for bevegelsesdeteksjon
    const SIGNIFICANT_MOVE_THRESHOLD = 0.001;
    const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;

    const FIT_BOUNDS_PADDING = 50;
    const FIT_BOUNDS_MAX_ZOOM = 14;
    const FIT_BOUNDS_DURATION = 1500;

    /**
     * Rapporterer kartets nåværende tilstand tilbake til ViewModel.
     */
    const reportMapStatus = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const center = map.getCenter();
        const bounds = map.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
        
        console.log("[DEBUG MAP] reportMapStatus: Henter byer for utsnitt...");
        const points = extractCityPoints();

        console.log(`[DEBUG MAP] reportMapStatus: Rapporterer ${points.length} punkter til VM.`);
        onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
    };

    /**
     * Trekker ut stedsnavn fra kartet og filtrerer dem basert på zoom-nivå (Spread).
     */
    const extractCityPoints = () => {
        const map = mapInstanceRef.current;
        if (!map) return [];

        console.log("[DEBUG MAP] extractCityPoints: Søker i utvidede kartlag for zoom", map.getZoom());
        
        // UTVIDELSE: Inkluderer 'State labels' og 'Country labels' for å finne store byer på landsnivå
        const features = map.queryRenderedFeatures({
            layers: [
                "City labels", 
                "Place labels", 
                "Country labels", 
                "State labels"
            ]
        });

        const rawPoints = [];
        const seen = new Set();

        // 1. Prioritet: Legg alltid til det punktet SSOT peker på (der brukeren er/søkte)
        rawPoints.push({
            name: "Valgt posisjon",
            lat: lat,
            lon: lon,
            isPriority: true
        });
        seen.add("priority-center");

        // 2. Samle potensielle byer/steder fra kart-lagene
        for (const feature of features) {
            const props = feature.properties;
            if (!feature.geometry || !props?.name) continue;
            
            const name = props.name;
            const className = props?.class;
            
            // Vi filtrerer ut land-navn, men beholder byer/steder
            if (className !== "country" && !seen.has(name)) {
                const coords = feature.geometry.coordinates;
                rawPoints.push({
                    name: name,
                    lon: coords[0],
                    lat: coords[1],
                    type: className || "place",
                    isPriority: false
                });
                seen.add(name);
            }
        }

        // 3. Filtrering basert på avstand (Spread-logikk)
        const currentZoom = map.getZoom();
        const minDist = calculateWeatherIconSpread(currentZoom);
        const filteredPoints = [];

        for (const point of rawPoints) {
            if (point.isPriority) {
                filteredPoints.push(point);
                continue;
            }

            const isTooClose = filteredPoints.some(existing => {
                const dLat = existing.lat - point.lat;
                const dLon = existing.lon - point.lon;
                return (dLat * dLat + dLon * dLon) < (minDist * minDist);
            });

            if (!isTooClose) {
                filteredPoints.push(point);
            }

            if (filteredPoints.length >= 15) break; 
        }

        console.log(`[DEBUG MAP] extractCityPoints: Fant ${rawPoints.length} rå-labels, beholdt ${filteredPoints.length} etter filtrering.`);
        return filteredPoints;
    };

    /**
     * 1. INITIALISERING
     */
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        console.log("[DEBUG MAP] Initialiserer maptilersdk...");
        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon || 0), Number(lat || 0)],
            zoom: Number(zoom || 12),
            attributionControl: false,
            navigationControl: true,
            geolocateControl: false,
        });

        map.on("load", () => {
            console.log("[DEBUG MAP] Kart lastet (load)");
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: ["City labels", "Place labels"],
                markerSize: [40, 70],
                offset: [0, -10]
            });

            setTimeout(() => {
                console.log("[DEBUG MAP] Kjører initial reportMapStatus");
                reportMapStatus();
            }, 250);
        });

        map.on("moveend", () => {
            if (isProgrammaticMove.current) {
                console.log("[DEBUG MAP] moveend: Programmatisk flytting ferdig.");
                isProgrammaticMove.current = false;
                return;
            }
            console.log("[DEBUG MAP] moveend: Brukerstyrt flytting ferdig.");
            requestAnimationFrame(reportMapStatus);
        });

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);

    /**
     * 2. MARKERE: Tegn værikoner
     */
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        console.log(`[DEBUG MAP] Oppdaterer markører. Antall weatherPoints: ${weatherPoints?.length || 0}`);
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!weatherPoints) return;

        weatherPoints.forEach(point => {
            const container = document.createElement("div");
            container.className = "map-marker-wrapper";
            
            container.onclick = (e) => {
                e.stopPropagation();
                if (onLocationClick) onLocationClick(point);
            };

            const root = createRoot(container);
            root.render(<WeatherSymbolLabel point={point} />);

            const marker = new maptilersdk.Marker({ element: container })
                .setLngLat([point.lon, point.lat])
                .addTo(map);

            markersRef.current.push(marker);
        });
    }, [weatherPoints, onLocationClick]);

    /**
     * 3. SYNKRONISERING: Håndter Reset, Søk og BBox-flytting
     */
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        const reportWithDelay = (source) => {
            console.log(`[DEBUG MAP] reportWithDelay trigget fra: ${source}. Venter på labels...`);
            // Økt delay til 350ms for å sikre at store kartutsnitt rekker å tegne labels
            setTimeout(reportMapStatus, 350);
        };

        if (bboxToFit) {
            console.log("[DEBUG MAP] Synkronisering: fitBounds trigget", bboxToFit);
            isProgrammaticMove.current = true;
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });
            reportWithDelay("bboxToFit");
            return;
        }

        const center = map.getCenter();
        const currentZoom = map.getZoom();

        const hasMoved = Math.abs(center.lat - lat) > SIGNIFICANT_MOVE_THRESHOLD || 
                         Math.abs(center.lng - lon) > SIGNIFICANT_MOVE_THRESHOLD ||
                         Math.abs(currentZoom - zoom) > SIGNIFICANT_ZOOM_THRESHOLD;

        if (hasMoved) {
            console.log(`[DEBUG MAP] Synkronisering: flyTo trigget (lat: ${lat}, lon: ${lon})`);
            isProgrammaticMove.current = true;
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });
            
            map.once('moveend', () => reportWithDelay("flyTo"));
        }
    }, [lat, lon, zoom, bboxToFit]);

    return mapContainerRef;
}