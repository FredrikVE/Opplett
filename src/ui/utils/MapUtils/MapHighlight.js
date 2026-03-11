//src/ui/utils/MapUtils/MapHighlight.js
export function updateMapHighlight(map, geojson) {
    if (!map || !map.getStyle()) return;

    // Hvis vi ikke har geometri, tøm kilden hvis den finnes
    if (!geojson) {
        const source = map.getSource("highlight-source");
        if (source) {
            source.setData({ type: "FeatureCollection", features: [] });
        }
        return;
    }

    // Vent til stilen er helt klar
    if (!map.isStyleLoaded()) {
        map.once("idle", () => updateMapHighlight(map, geojson));
        return;
    }

    const source = map.getSource("highlight-source");

    if (source) {
        // Bruk try-catch her fordi setData kan feile hvis kilden er i ferd med å bli slettet
        try {
            source.setData(geojson);
        } catch (e) {
            console.warn("Kunne ikke sette data på eksisterende source", e);
        }
    } else {
        // Opprett kilden og lagene hvis de ikke finnes
        map.addSource("highlight-source", {
            type: "geojson",
            data: geojson
        });

        map.addLayer({
            id: "highlight-fill",
            type: "fill",
            source: "highlight-source",
            paint: {
                "fill-color": "#4285F4",
                "fill-opacity": 0.05
            }
        });

        map.addLayer({
            id: "highlight-line-glow",
            type: "line",
            source: "highlight-source",
            paint: {
                "line-color": "#4285F4",
                "line-width": 8,
                "line-opacity": 0.25
            }
        });

        map.addLayer({
            id: "highlight-line-main",
            type: "line",
            source: "highlight-source",
            paint: {
                "line-color": "#4285F4",
                "line-width": 2,
                "line-opacity": 0.9
            }
        });
    }
}