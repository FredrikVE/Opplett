// src/ui/utils/MapUtils/HighlightBorder/MapHighlight.js
const SOURCE_ID = "highlight-source";

const LAYERS = {
	fill: "highlight-fill",
	glow: "highlight-line-glow",
	line: "highlight-line-main",
};

const EMPTY_GEOJSON = {
	type: "FeatureCollection",
	features: [],
};

function ensureHighlightLayers(map) {
	if (!map.getSource(SOURCE_ID)) {
		map.addSource(SOURCE_ID, {
			type: "geojson",
			data: EMPTY_GEOJSON,
		});
	}

	if (!map.getLayer(LAYERS.fill)) {
		map.addLayer({
			id: LAYERS.fill,
			type: "fill",
			source: SOURCE_ID,
			paint: {
				"fill-color": "#4285F4",
				"fill-opacity": 0.05,
			},
		});
	}

	if (!map.getLayer(LAYERS.glow)) {
		map.addLayer({
			id: LAYERS.glow,
			type: "line",
			source: SOURCE_ID,
			paint: {
				"line-color": "#4285F4",
				"line-width": 8,
				"line-opacity": 0.25,
			},
		});
	}

	if (!map.getLayer(LAYERS.line)) {
		map.addLayer({
			id: LAYERS.line,
			type: "line",
			source: SOURCE_ID,
			paint: {
				"line-color": "#4285F4",
				"line-width": 2,
				"line-opacity": 0.9,
			},
		});
	}
}

export function syncMapHighlight(map, geojson) {
	if (!map || !map.getStyle()) {
		return;
	}

	if (!map.isStyleLoaded()) {
		map.once("idle", () => syncMapHighlight(map, geojson));
		return;
	}

	ensureHighlightLayers(map);

	const source = map.getSource(SOURCE_ID);
	if (!source) {
		return;
	}

	try {
		source.setData(geojson ?? EMPTY_GEOJSON);
	}
	
	catch (error) {
		console.warn("[MapHighlight] Kunne ikke oppdatere highlight:", error);
	}
}