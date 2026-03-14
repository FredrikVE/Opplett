//src/ui/view/components/MapPage/hooks/useMapCamera.js
import { useEffect, useRef } from "react";
import { MAP_ANIMATION, MAP_CAMERA, MAP_ZOOM_LIMITS } from "../../../../utils/MapUtils/Constants/MapConstants.js";


export function useMapCamera(map, mapTarget) {
    const lastMoveIdRef = useRef(null);

    useEffect(() => {
        if (!map || !mapTarget) {
            return;
        }
        
        if (lastMoveIdRef.current === mapTarget.id) {
            return;
        }

        lastMoveIdRef.current = mapTarget.id;

        if (mapTarget.type === MAP_CAMERA.BOUNDS) {
            map.fitBounds(mapTarget.data, {
                padding: mapTarget.isArea ? MAP_ANIMATION.PADDING.AREA : MAP_ANIMATION.PADDING.POINT,
                maxZoom: MAP_ZOOM_LIMITS.MAX,
                duration: MAP_ANIMATION.DURATION_MS,
                essential: true
            });
        } 
        
        else {
            map.flyTo({
                center: [mapTarget.data.lon, mapTarget.data.lat],
                //zoom: mapTarget.data.zoom,
                zoom: Math.min(mapTarget.data.zoom, MAP_ZOOM_LIMITS.MAX),
                speed: MAP_ANIMATION.FLY_SPEED,
                essential: true
            });
        }
    }, [map, mapTarget]);
}