// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

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
     * Hjelpefunksjon for å trekke ut stedsnavn fra kartet for værmelding
     */
    const extractCityPoints = () => {
        const map = mapInstanceRef.current;
        if (!map) return [];

        const features = map.queryRenderedFeatures({
            layers: ["City labels", "Place labels"] // MapTiler Streets-v2 standard lag
        });

        const points = [];
        const seen = new Set();

        for (const feature of features) {
            if (!feature.geometry || !feature.properties?.name) continue;
            
            // Vi filtrerer for å unngå duplikater og uinteressante småsteder
            const name = feature.properties.name;
            const className = feature.properties?.class;
            
            if (["city", "town", "village"].includes(className) && !seen.has(name)) {
                const coords = feature.geometry.coordinates;
                points.push({
                    name: name,
                    lon: coords[0],
                    lat: coords[1],
                    type: className
                });
                seen.add(name);
            }
        }
        return points;
    };

    /**
     * 1. INITIALISERING: Opprett kartet én gang
     */
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

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
            // MarkerLayout hjelper med å unngå kollisjon mellom våre ikoner og kartets labels
            markerLayoutRef.current = new MarkerLayout(map, {
                layers: ["City labels", "Place labels"],
                markerSize: [40, 70],
                offset: [0, -10]
            });

            const bounds = map.getBounds();
            const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
            const points = extractCityPoints();

            onMapChange(lat, lon, bbox, map.getZoom(), points);
        });

		/*
        map.on("moveend", () => {
            // Hvis flyttingen ble trigget av kode (f.eks. reset-knapp), ikke send onMapChange på nytt
            if (isProgrammaticMove.current) {
                isProgrammaticMove.current = false;
                return;
            }

            const center = map.getCenter();
            const bounds = map.getBounds();
            const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
            const points = extractCityPoints();

            onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
        });
		*/

		map.on("moveend", () => {

			if (isProgrammaticMove.current) {
				isProgrammaticMove.current = false;
				return;
			}

			requestAnimationFrame(() => {

				const center = map.getCenter();
				const bounds = map.getBounds();

				const bbox = [
					bounds.getWest(),
					bounds.getSouth(),
					bounds.getEast(),
					bounds.getNorth()
				];

				const points = extractCityPoints();

				onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);

			});
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
     * 2. MARKERE: Tegn værikoner når weatherPoints endres
     */
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Fjern gamle markører
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (!weatherPoints) return;

        weatherPoints.forEach(point => {
            const container = document.createElement("div");
            container.className = "map-marker-wrapper";
            container.style.cursor = "pointer";

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
     * 3. SYNKRONISERING: Flytt kartet når lat/lon/bbox endres (f.eks. ved RESET eller SØK)
     */
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        // PRIORITET 1: Bounding Box (Søk på by/land/fylke)
        if (bboxToFit) {
            isProgrammaticMove.current = true;
            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });
            return;
        }

        // PRIORITET 2: Spesifikke koordinater (Reset My Location eller punkt-klikk)
        const center = map.getCenter();
        const currentZoom = map.getZoom();

        const hasMoved = Math.abs(center.lat - lat) > SIGNIFICANT_MOVE_THRESHOLD || 
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