//src/ui/view/components/MapPage/hooks/useMapHighlight.js
import { useEffect } from "react";
import { syncMapHighlight } from "../../../../utils/MapUtils/HighlightBorder/MapHighlight.js";

export function useMapHighlight(map, highlightGeometry) {
	useEffect(() => {
		if (!map) {
			return;
		}

		syncMapHighlight(map, highlightGeometry);
	}, 
	[map, highlightGeometry]);
}
