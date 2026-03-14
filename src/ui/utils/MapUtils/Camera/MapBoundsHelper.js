//src/ui/utils/MapUtils/Camera/MapBoundsHelper.js

/**
 * Beregner geografiske yttergrenser (BBox) basert på GeoJSON-geometri.
 * Prioriterer den største landmassen for å unngå for vidt utsnitt på land med fjerne øyer.
 *
 * @param {Object} geojson - GeoJSON FeatureCollection
 * @returns {Array|null} - [[SW_lng, SW_lat], [NE_lng, NE_lat]]
 */
export function getBoundsFromGeometry(geojson) {
    if (!geojson?.features?.length) {
        return null;
    }

    /**
     * Beregner et enkelt polygon-areal med "shoelace formula".
     * Vi bruker absoluttverdi siden vi bare er ute etter størrelse.
     *
     * @param {Array<Array<number>>} ring
     * @returns {number}
     */
    function getRingArea(ring) {
        if (!Array.isArray(ring) || ring.length < 4) {
            return 0;
        }

        let area = 0;

        for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i];
            const [x2, y2] = ring[i + 1];

            area += (x1 * y2) - (x2 * y1);
        }

        return Math.abs(area / 2);
    }

    /**
     * Trekker ut alle ytre ringer fra Polygon og MultiPolygon.
     */
    const outerRings = [];

    geojson.features.forEach((feature) => {
        const { type, coordinates } = feature.geometry || {};

        if (type === "Polygon" && Array.isArray(coordinates?.[0])) {
            // Første ring er alltid ytre ring
            outerRings.push(coordinates[0]);
        }

        else if (type === "MultiPolygon" && Array.isArray(coordinates)) {
            coordinates.forEach((polygonCoords) => {
                if (Array.isArray(polygonCoords?.[0])) {
                    // Første ring i hvert polygon er ytre ring
                    outerRings.push(polygonCoords[0]);
                }
            });
        }
    });

    if (outerRings.length === 0) {
        return null;
    }

    /**
     * Finn ringen med størst faktisk areal,
     * ikke bare flest koordinatpunkter.
     */
    const mainlandRing = outerRings.reduce((largest, current) => {
        return getRingArea(current) > getRingArea(largest) ? current : largest;
    });

    /**
     * Hvis største ring er stor nok, bruk bare den.
     * Hvis geometrien er liten/enkel, bruk alle ringer samlet.
     * Dette gir bedre utsnitt for små områder, men mer stabile utsnitt for land.
     */
    const pointsToCalculate = mainlandRing.length > 10
        ? mainlandRing
        : outerRings.flat();

    if (!pointsToCalculate.length) {
        return null;
    }

    const longitudes = pointsToCalculate.map((point) => point[0]);
    const latitudes = pointsToCalculate.map((point) => point[1]);

    const SW_lng = Math.min(...longitudes);
    const SW_lat = Math.min(...latitudes);
    const NE_lng = Math.max(...longitudes);
    const NE_lat = Math.max(...latitudes);

    return [
        [SW_lng, SW_lat],
        [NE_lng, NE_lat]
    ];
}