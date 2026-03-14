// src/ui/view/components/MapPage/hooks/useMapMarkerLayout.js
import { useEffect, useRef } from "react";
import { MarkerLayout } from "@maptiler/marker-layout";
import { MAP_MARKER_CONFIG } from "../../../../utils/MapUtils/MapConfig.js";
import { getFeaturePriorityScore, syncAbstractMarkersFromLayout } from "../../../../utils/MapUtils/MarkerLayoutUtils.js";
import { extractCityPointsFromMarkers } from "../../../../utils/MapUtils/ExtractCityPoints.js";

export function useMapMarkerLayout(map, activeLocation, onVisiblePointsChange) {
    const markerLayoutRef = useRef(null);
    const layoutMarkersRef = useRef(new Map());

    useEffect(() => {
        if (!map) {
            return;
        }

        //Kopier ref til lokal variabel for trygg cleanup (Linter fiks)
        const currentLayoutMarkers = layoutMarkersRef.current;

        //Setter zoom ranges per config
        const { MIN, MAX } = MAP_MARKER_CONFIG.LABEL_LAYER_ZOOM_RANGE;
        MAP_MARKER_CONFIG.LABEL_LAYERS.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayerZoomRange(layerId, MIN, MAX);
            }
        });

        markerLayoutRef.current = new MarkerLayout(map, {
            layers: MAP_MARKER_CONFIG.LABEL_LAYERS,
            markerAnchor: "center",
            max: MAP_MARKER_CONFIG.MAX_LAYOUT_MARKERS,
            sortingProperty: getFeaturePriorityScore,
            sortingOrder: "ascending",
        });

        const handleFullUpdate = () => {
            if (!markerLayoutRef.current) {
                return;
            }
            
            const abstractMarkers = syncAbstractMarkersFromLayout(
                markerLayoutRef.current, 
                currentLayoutMarkers
            );
            
            const points = extractCityPointsFromMarkers({
                abstractMarkers,
                zoom: map.getZoom(),
                activeLocation
            });

            onVisiblePointsChange(points);
        };

        const handleSoftUpdate = () => {
            if (!markerLayoutRef.current) {
                return;
            }

            currentLayoutMarkers.forEach((marker) => {
                markerLayoutRef.current.softUpdateAbstractMarker(marker);
            });
        };

        map.on("move", handleSoftUpdate);
        map.on("idle", handleFullUpdate);
        
        //Initial oppdatering
        handleFullUpdate();

        return () => {
            map.off("move", handleSoftUpdate);
            map.off("idle", handleFullUpdate);
            markerLayoutRef.current = null;
            currentLayoutMarkers.clear();           // Bruker lokal variabel i cleanup
        };

    }, [map, activeLocation, onVisiblePointsChange]); 
}