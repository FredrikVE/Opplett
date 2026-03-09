// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {
    const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick, activeLocation } = props;

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const markerLayoutRef = useRef(null);
    const activeAbstractMarkersRef = useRef(new Map());
    
    const isProgrammaticMove = useRef(false);
    const idleDebounceRef = useRef(null);

    // ALLTID ferskeste lokasjon (løser "spøkelses"-søket)
    const activeLocationRef = useRef(activeLocation);
    useEffect(() => {
        activeLocationRef.current = activeLocation;
    }, [activeLocation]);

    const SIGNIFICANT_MOVE_THRESHOLD = 0.001;
    const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;

    const FIT_BOUNDS_PADDING = 50;
    const FIT_BOUNDS_MAX_ZOOM = 14;
    const FIT_BOUNDS_DURATION = 1500;

    function isInsideBounds(pointLat, pointLon, bounds) {
        if (!bounds?.southwest || !bounds?.northeast) return true;
        return (
            pointLat >= bounds.southwest.lat &&
            pointLat <= bounds.northeast.lat &&
            pointLon >= bounds.southwest.lng &&
            pointLon <= bounds.northeast.lng
        );
    }

    // NY FUNKSJON: Sjekker om bounding boxen er absurd stor (spenner over store deler av kloden)
    function isBoundsTooLarge(bounds) {
        if (!bounds?.southwest || !bounds?.northeast) return true;
        
        const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
        const lonDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);
        
        // Hvis boksen spenner over mer enn 60 grader i en retning, er den for stor til å være nyttig
        // for nøyaktig filtrering. (Gjelder USA, Russland, Norge pga Bouvetøya etc).
        return latDiff > 60 || lonDiff > 60;
    }

    function getLayerPriority(layerId) {
        switch (layerId) {
            case "Capital city labels": return 0;
            case "City labels": return 1;
            case "Town labels": return 2;
            case "Place labels": return 3;
            default: return 99;
        }
    }

    function getFeaturePriorityScore(feature) {
        const props = feature.properties || {};
        const rank = Number(props.rank ?? 9999);
        const layerPriority = getLayerPriority(feature.layer?.id);
        return layerPriority * 10000 + rank;
    }

    function getMaxPointsForZoom(currentZoom) {
        if (currentZoom <= 4) return 12;
        if (currentZoom <= 6) return 12;
        if (currentZoom <= 8) return 12;
        if (currentZoom <= 10) return 10;
        return 6;
    }

    function syncAbstractMarkersFromLayout() {
        const markerLayout = markerLayoutRef.current;
        if (!markerLayout) return [];

        const markerStatus = markerLayout.update();
        if (!markerStatus) {
            return Array.from(activeAbstractMarkersRef.current.values());
        }

        markerStatus.removed.forEach((am) => activeAbstractMarkersRef.current.delete(am.id));
        markerStatus.updated.forEach((am) => activeAbstractMarkersRef.current.set(am.id, am));
        markerStatus.new.forEach((am) => activeAbstractMarkersRef.current.set(am.id, am));

        return Array.from(activeAbstractMarkersRef.current.values());
    }

    const reportMapStatus = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const center = map.getCenter();
        const bounds = map.getBounds();
        const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

        console.log("[DEBUG MAP] reportMapStatus: Kartet er ferdig rendret. Henter byer...");
        const points = extractCityPoints();

        console.log(`[DEBUG MAP] reportMapStatus: Rapporterer ${points.length} punkter til VM.`);
        onMapChange(center.lat, center.lng, bbox, map.getZoom(), points);
    };

    const extractCityPoints = () => {
        const map = mapInstanceRef.current;
        if (!map) return [];

        const currentLoc = activeLocationRef.current;
        const selectedType = currentLoc?.type ?? null;
        const selectedBounds = currentLoc?.bounds ?? null;
        const pointLat = currentLoc?.lat;
        const pointLon = currentLoc?.lon;

        // Vi inkluderer country igjen...
        let shouldRestrictToSelectedBounds =
            ["country", "major_landform", "region", "subregion", "county", "municipality"].includes(selectedType);

        // ...MEN vi slår av bbox-filtreringen hvis boksen er korrupt/gigantisk!
        if (shouldRestrictToSelectedBounds && isBoundsTooLarge(selectedBounds)) {
            shouldRestrictToSelectedBounds = false;
        }

        const abstractMarkers = syncAbstractMarkersFromLayout();
        const mappedPoints = [];
        const seen = new Set();

        // Kun vis "Valgt posisjon" hvis vi ikke har søkt på et helt land/region
        const shouldIncludeSelectedPoint =
            pointLat != null && pointLon != null &&
            !shouldRestrictToSelectedBounds &&
            !["continent", "continental_marine"].includes(selectedType);

        if (shouldIncludeSelectedPoint) {
            mappedPoints.push({
                id: currentLoc?.id ?? null,
                name: currentLoc?.name || "Valgt posisjon",
                lat: pointLat, 
                lon: pointLon,
                type: selectedType,
                bounds: selectedBounds,
                countryCode: currentLoc?.countryCode ?? null,
                context: currentLoc?.context ?? [],
                isPriority: true
            });
            seen.add(`selected:${pointLat.toFixed(4)}:${pointLon.toFixed(4)}`);
        }

        const sortedMarkers = [...abstractMarkers].sort((a, b) => {
            return getFeaturePriorityScore(a.features?.[0]) - getFeaturePriorityScore(b.features?.[0]);
        });

        for (const abstractMarker of sortedMarkers) {
            const feature = abstractMarker.features?.[0];
            const props = feature?.properties || {};
            const geometry = feature?.geometry;

            if (!geometry || !props.name) continue;

            const fLon = geometry.coordinates[0];
            const fLat = geometry.coordinates[1];

            if (shouldRestrictToSelectedBounds && selectedBounds) {
                if (!isInsideBounds(fLat, fLon, selectedBounds)) continue;
            }

            const dedupeKey = `${props.name}:${fLat.toFixed(4)}:${fLon.toFixed(4)}`;
            if (seen.has(dedupeKey)) continue;

            mappedPoints.push({
                id: feature.id ?? null,
                name: props.name,
                lon: fLon,
                lat: fLat,
                type: props.class || "city", 
                rank: Number(props.rank ?? 9999),
                layerId: feature.layer?.id ?? null,
                countryCode: props.iso_a2 || props.country_code || null,
                context: feature.context || [],
                isPriority: false
            });

            seen.add(dedupeKey);
        }

        const maxPoints = getMaxPointsForZoom(map.getZoom());
        const finalPoints = mappedPoints.slice(0, maxPoints);

        console.log(`[DEBUG MAP] extractCityPoints: Fant ${abstractMarkers.length} layout-markører, beholdt ${finalPoints.length}.`);
        return finalPoints;
    };

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

            // TVING by-lagene til å være synlige helt ned til zoom 2
            const labelLayers = ["Capital city labels", "City labels", "Town labels", "Place labels"];
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

                    // Filtrer ut byer fra andre land hvis vi har søkt på et land
                    if (currentLoc?.type === "country" && currentLoc?.countryCode) {
                        const tileCountryCode = props.iso_a2 || props.country_code;
                        
                        // Godta hvis det matcher. Hvis tileCountryCode mangler, godta (viktig for store byer)
                        if (tileCountryCode) {
                            return tileCountryCode.toLowerCase() === currentLoc.countryCode.toLowerCase();
                        }
                    }
                    return true;
                }
            });
        });

        map.on("move", () => {
            const markerLayout = markerLayoutRef.current;
            if (!markerLayout) return;
            activeAbstractMarkersRef.current.forEach((abstractMarker, id) => {
                markerLayout.softUpdateAbstractMarker(abstractMarker);
                activeAbstractMarkersRef.current.set(id, abstractMarker);
            });
        });

        map.on("moveend", () => {
            if (isProgrammaticMove.current) {
                console.log("[DEBUG MAP] moveend: Programmatisk flytting ferdig.");
                isProgrammaticMove.current = false;
            }
        });

        map.on("idle", () => {
            if (isProgrammaticMove.current) return;

            clearTimeout(idleDebounceRef.current);
            idleDebounceRef.current = setTimeout(() => {
                reportMapStatus();
            }, 300); // 300ms gir god tid til at layouten oppdaterer seg før vi høster byer
        });

        mapInstanceRef.current = map;

        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            activeAbstractMarkersRef.current.clear();

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        if (!weatherPoints || weatherPoints.length === 0) return;

        weatherPoints.forEach((point) => {
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

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null) return;

        if (bboxToFit) {
            console.log("[DEBUG MAP] Synkronisering: fitBounds trigget");
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
            console.log(`[DEBUG MAP] Synkronisering: flyTo trigget (lat: ${lat}, lon: ${lon})`);
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