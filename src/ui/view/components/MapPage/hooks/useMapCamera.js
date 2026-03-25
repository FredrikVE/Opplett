//src/ui/view/components/MapPage/hooks/useMapCamera.js
import { useEffect, useRef, useCallback } from "react";

const CAMERA_FLY_SPEED = 1.2;
const MAX_CAMERA_ZOOM = 14;

export function useMapCamera(map, mapTarget) {

	const lastMoveIdRef = useRef(null);

	const flyToTarget = useCallback((target) => {
		map.flyTo({
			center: [target.lon, target.lat],
			zoom: Math.min(target.zoom, MAX_CAMERA_ZOOM),
			speed: CAMERA_FLY_SPEED,
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