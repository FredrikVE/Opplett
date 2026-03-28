//src/ui/view/components/MapPage/MapHooks/useMapCamera.js
import { useEffect, useRef, useCallback } from "react";
import { MAX_ZOOM } from "../../../../utils/MapUtils/Zoom/ZoomConfig";

const CAMERA_FLY_SPEED = 1.2;

export function useMapCamera(map, mapTarget) {

	const lastMoveIdRef = useRef(null);
	const hasInitialFlyRef = useRef(false);

	//Flyr til enten userLocation eller stedsøk
	const flyToTarget = useCallback((target) => {
		map.flyTo({
			center: [target.lon, target.lat],
			zoom: Math.min(target.zoom, MAX_ZOOM),	//Velger laveste zoom av definert zoomnivå for område
			speed: CAMERA_FLY_SPEED,
			essential: true,
		});
	}, [map]);

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

		//Skip første flyTo (beholder initial zoom fra useMapInit)
		if (!hasInitialFlyRef.current) {
			hasInitialFlyRef.current = true;
			return;
		}

		if (shouldSkipMove(mapTarget.id)) {
			return;
		}

		markMoveHandled(mapTarget.id);
		flyToTarget(mapTarget);

	}, 
	[map, mapTarget, shouldSkipMove, markMoveHandled, flyToTarget]);

	useEffect(onMapTargetChangedFlyCamera, [onMapTargetChangedFlyCamera]);
}