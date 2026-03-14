//src/ui/utils/MapUtils/HighlightBorder/MapHighlight.js
import { MAP_HIGHLIGHT } from "../Constants/MapConstants.js";

const EMPTY_GEOJSON = {
    type: "FeatureCollection",
    features: []
};

function ensureHighlightLayers(map) {
    if (!map.getSource(MAP_HIGHLIGHT.SOURCE_ID)) {
        map.addSource(MAP_HIGHLIGHT.SOURCE_ID, {
            type: "geojson",
            data: EMPTY_GEOJSON
        });
    }

    if (!map.getLayer(MAP_HIGHLIGHT.FILL_LAYER_ID)) {
        map.addLayer({
            id: MAP_HIGHLIGHT.FILL_LAYER_ID,
            type: "fill",
            source: MAP_HIGHLIGHT.SOURCE_ID,
            paint: {
                "fill-color": "#4285F4",
                "fill-opacity": 0.05
            }
        });
    }

    if (!map.getLayer(MAP_HIGHLIGHT.GLOW_LAYER_ID)) {
        map.addLayer({
            id: MAP_HIGHLIGHT.GLOW_LAYER_ID,
            type: "line",
            source: MAP_HIGHLIGHT.SOURCE_ID,
            paint: {
                "line-color": "#4285F4",
                "line-width": 8,
                "line-opacity": 0.25
            }
        });
    }

    if (!map.getLayer(MAP_HIGHLIGHT.LINE_LAYER_ID)) {
        map.addLayer({
            id: MAP_HIGHLIGHT.LINE_LAYER_ID,
            type: "line",
            source: MAP_HIGHLIGHT.SOURCE_ID,
            paint: {
                "line-color": "#4285F4",
                "line-width": 2,
                "line-opacity": 0.9
            }
        });
    }
}

export function syncMapHighlight(map, geojson) {
    if (!map || !map.getStyle()) return;

    if (!map.isStyleLoaded()) {
        map.once("idle", () => syncMapHighlight(map, geojson));
        return;
    }

    ensureHighlightLayers(map);

    const source = map.getSource(MAP_HIGHLIGHT.SOURCE_ID);
    if (!source) return;

    try {
        source.setData(geojson ?? EMPTY_GEOJSON);
    } 
    
    catch (error) {
        console.warn("[MapHighlight] Kunne ikke oppdatere highlight:", error);
    }
}