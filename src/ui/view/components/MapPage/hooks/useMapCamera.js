import { useEffect, useRef, useCallback } from "react";
import { MAP_ANIMATION, MAP_ZOOM_LIMITS } from "../../../../utils/MapUtils/Constants/MapConstants.js";

/* =========================
	HOOK
========================= */

export function useMapCamera(map, mapTarget) {

	const lastMoveIdRef = useRef(null);

	const flyToTarget = useCallback((target) => {
		map.flyTo({
			center: [target.lon, target.lat],
			zoom: Math.min(target.zoom, MAP_ZOOM_LIMITS.MAX),
			speed: MAP_ANIMATION.FLY_SPEED,
			essential: true,
		});
	}, 
	
	[map]);

	const shouldSkipMove = useCallback((targetId) => {
		return lastMoveIdRef.current === targetId;
	}, 
	
	[]);

	const markMoveHandled = useCallback((targetId) => {
		lastMoveIdRef.current = targetId;
	}, 
	
	[]);

	const onMapTargetChangedFlyCamera = useCallback(() => {
		if (!map || !mapTarget) {
			return;
		}

		if (shouldSkipMove(mapTarget.id)) {
			return;
		}

		markMoveHandled(mapTarget.id);
		flyToTarget(mapTarget);

	}, 

	[map, mapTarget, shouldSkipMove, markMoveHandled, flyToTarget]);

	useEffect(onMapTargetChangedFlyCamera, [
		onMapTargetChangedFlyCamera
	]);
}