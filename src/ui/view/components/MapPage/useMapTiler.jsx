import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {

    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const isProgrammaticMove = useRef(false);

    const SIGNIFICANT_MOVE_THRESHOLD = 0.01;
    const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;

    const FIT_BOUNDS_PADDING = 50;
    const FIT_BOUNDS_MAX_ZOOM = 14;
    const FIT_BOUNDS_DURATION = 1500;

    /**
     * Initialiser kartet
     */
    useEffect(() => {

        if (!mapContainerRef.current) {
            return;
        }

        if (mapInstanceRef.current) {
            return;
        }

        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom),
            attributionControl: false,
            navigationControl: true, 
            geolocateControl: false,
        });

        map.on("load", () => {

            const bounds = map.getBounds();

            const bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ];

            onMapChange(lat, lon, bbox, map.getZoom());
        });

        map.on("moveend", () => {

            if (isProgrammaticMove.current) {
                isProgrammaticMove.current = false;
                return;
            }

            const center = map.getCenter();
            const bounds = map.getBounds();

            const bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ];

            onMapChange(
                center.lat,
                center.lng,
                bbox,
                map.getZoom()
            );
        });

        mapInstanceRef.current = map;

        return () => {

            if (!mapInstanceRef.current) {
                return;
            }

            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;

        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);



    /**
     * Marker-logikk
     */
    useEffect(() => {

        const map = mapInstanceRef.current;

        if (!map) {
            return;
        }

        for (const marker of markersRef.current) {
            marker.remove();
        }

        markersRef.current = [];

        if (!weatherPoints || weatherPoints.length === 0) {
            return;
        }

        for (const point of weatherPoints) {

            const element = document.createElement("div");
            element.className = "map-marker-wrapper";
            element.style.zIndex = "1000";

            element.onclick = () => {
                if (onLocationClick) {
                    onLocationClick(point);
                }
            };

            const root = createRoot(element);
            root.render(<WeatherSymbolLabel point={point} />);

            const marker = new maptilersdk.Marker({ element })
                .setLngLat([point.lon, point.lat])
                .addTo(map);

            markersRef.current.push(marker);
        }

    }, [weatherPoints, onLocationClick]);



    /**
     * Programmatisk flytting av kart
     */
    useEffect(() => {

        const map = mapInstanceRef.current;

        if (!map) {
            return;
        }

        // PRIORITET 1: Bounding box
        if (bboxToFit) {

            isProgrammaticMove.current = true;

            map.fitBounds(bboxToFit, {
                padding: FIT_BOUNDS_PADDING,
                maxZoom: FIT_BOUNDS_MAX_ZOOM,
                duration: FIT_BOUNDS_DURATION
            });

            return;
        }

        // PRIORITET 2: Punkt-flytting
        const center = map.getCenter();

        const latMoved =
            Math.abs(center.lat - lat) > SIGNIFICANT_MOVE_THRESHOLD;

        const lonMoved =
            Math.abs(center.lng - lon) > SIGNIFICANT_MOVE_THRESHOLD;

        const zoomChanged =
            Math.abs(map.getZoom() - zoom) > SIGNIFICANT_ZOOM_THRESHOLD;

        const hasMovedSignificantly =
            latMoved || lonMoved || zoomChanged;

        if (!hasMovedSignificantly) {
            return;
        }

        isProgrammaticMove.current = true;

        map.flyTo({
            center: [lon, lat],
            zoom: zoom,
            speed: 1.2,
            curve: 1.4,
            essential: true
        });

    }, [lat, lon, zoom, bboxToFit]);



    return mapContainerRef;
}