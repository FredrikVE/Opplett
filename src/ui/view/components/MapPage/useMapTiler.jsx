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

    function isBoundsTooLarge(bounds) {
        if (!bounds?.southwest || !bounds?.northeast) return true;
        
        const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
        const lonDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);
        
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
        if (currentZoom <= 4) return 10;
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

        const points = extractCityPoints();
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

        let shouldRestrictToSelectedBounds =
            ["country", "major_landform", "region", "subregion", "county", "municipality"].includes(selectedType);

        if (shouldRestrictToSelectedBounds && isBoundsTooLarge(selectedBounds)) {
            shouldRestrictToSelectedBounds = false;
        }

        const abstractMarkers = syncAbstractMarkersFromLayout();
        const mappedPoints = [];
        const seen = new Set();

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

        return finalPoints;
    };

    // NY FUNKSJON: Henter polygon og tegner blå grense på kartet
    const updateMapHighlight = async (location) => {
        const map = mapInstanceRef.current;
        if (!map || !map.style) return;

        const validTypes = ["country", "major_landform", "region", "subregion", "county", "municipality"];
        
        // Fjern highlight hvis det ikke er et stort område (f.eks. "Min posisjon" eller en bestemt adresse)
        if (!location?.id || !validTypes.includes(location.type)) {
            if (map.getSource('highlight-source')) {
                map.getSource('highlight-source').setData({ type: "FeatureCollection", features: [] });
            }
            return;
        }

        try {
            const res = await fetch(`https://api.maptiler.com/geocoding/${location.id}.json?key=${apiKey}`);
            if (!res.ok) return;
            const geojson = await res.json();

            // Sjekk om kartet fortsatt lever etter async-kallet
            if (!map.style) return;

            // Hvis kilden allerede finnes, bytt bare ut dataene. Hvis ikke, opprett kilden og lagene.
            if (map.getSource('highlight-source')) {
                map.getSource('highlight-source').setData(geojson);
            } else {
                map.addSource('highlight-source', { type: 'geojson', data: geojson });

                // 1. Svak blå fyllfarge
                map.addLayer({
                    id: 'highlight-fill',
                    type: 'fill',
                    source: 'highlight-source',
                    paint: {
                        'fill-color': '#4285F4',
                        'fill-opacity': 0.05
                    }
                });

                // 2. Tykk og dus blå "Glow" under streken
                map.addLayer({
                    id: 'highlight-line-glow',
                    type: 'line',
                    source: 'highlight-source',
                    paint: {
                        'line-color': '#4285F4',
                        'line-width': 8,
                        'line-opacity': 0.25
                    }
                });

                // 3. Skarp, tynnere hovedstrek i midten
                map.addLayer({
                    id: 'highlight-line-main',
                    type: 'line',
                    source: 'highlight-source',
                    paint: {
                        'line-color': '#4285F4',
                        'line-width': 2,
                        'line-opacity': 0.9
                    }
                });
            }
        } catch (e) {
            console.error("[DEBUG MAP] Feil ved opptegning av grenser:", e);
        }
    };

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

                    if (currentLoc?.type === "country" && currentLoc?.countryCode) {
                        const tileCountryCode = props.iso_a2 || props.country_code;
                        if (tileCountryCode) {
                            return tileCountryCode.toLowerCase() === currentLoc.countryCode.toLowerCase();
                        }
                    }
                    return true;
                }
            });

            // Tegn grensen første gang kartet lastes opp!
            updateMapHighlight(activeLocationRef.current);
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
                isProgrammaticMove.current = false;
            }
        });

        map.on("idle", () => {
            if (isProgrammaticMove.current) return;

            clearTimeout(idleDebounceRef.current);
            idleDebounceRef.current = setTimeout(() => {
                reportMapStatus();
            }, 300);
        });

        mapInstanceRef.current = map;

        const currentActiveMarkers = activeAbstractMarkersRef.current;

        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            currentActiveMarkers.clear();

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, style]);

    // NY EFFECT: Tegner grensen på nytt hver gang ID-en til søket endrer seg!
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (map && map.loaded()) {
            updateMapHighlight(activeLocation);
        }
    }, [activeLocation.id, apiKey]); 

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