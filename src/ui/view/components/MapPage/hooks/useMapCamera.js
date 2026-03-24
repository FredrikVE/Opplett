// src/ui/view/components/MapPage/hooks/useMapCamera.js
//
// Flytter kameraet når mapTarget endres (f.eks. etter søk).
// Kun flyTo — mapTarget har alltid { lat, lon, zoom }.

import { useEffect, useRef } from "react";
import { MAP_ANIMATION, MAP_ZOOM_LIMITS } from "../../../../utils/MapUtils/Constants/MapConstants.js";

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

		map.flyTo({
			center: [mapTarget.lon, mapTarget.lat],
			zoom: Math.min(mapTarget.zoom, MAP_ZOOM_LIMITS.MAX),
			speed: MAP_ANIMATION.FLY_SPEED,
			essential: true,
		});
	}, [map, mapTarget]);
}