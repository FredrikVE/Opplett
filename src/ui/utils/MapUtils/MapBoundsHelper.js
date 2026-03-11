//src/ui/utils/MapUtils/MapBoundsHelper.js

/**
 * Beregner geografiske yttergrenser (BBox) basert på GeoJSON-geometri.
 * Prioriterer den største landmassen for å unngå for vidt utsnitt på land med fjerne øyer.
 * * @param {Object} geojson - GeoJSON FeatureCollection
 * @returns {Array|null} - [[SW_lng, SW_lat], [NE_lng, NE_lat]]
 */
export function getBoundsFromGeometry(geojson) {
    if (!geojson?.features?.length) {
        return null;
    }

    //Trekker ut alle ytre ringer (linjer) fra Polygon og MultiPolygon
    const outerRings = [];

    geojson.features.forEach(feature => {
        const { type, coordinates } = feature.geometry || {};

        if (type === "Polygon") {
            //Første array i et Polygon er alltid den ytre ringen (den ytre grensen)
            outerRings.push(coordinates[0]);
        } 
        else if (type === "MultiPolygon") {
            //Et MultiPolygon består av flere Polygons, vi henter ytre ring fra alle
            coordinates.forEach(polygonCoords => {
                outerRings.push(polygonCoords[0]);
            });
        }
    });

    if (outerRings.length === 0) {
        return null;
    }

    // Finn den største landmassen (ringen med flest koordinater)
    // Dette fungerer som en god proxy for "fastlandet" (f.eks. for å ignorere småøyer)
    const mainlandRing = outerRings.reduce((largest, current) => 
        current.length > largest.length ? current : largest
    );

    //Velg hvilke koordinater som skal brukes for utregning
    //Bruker kun fastlandet hvis det er komplekst nok (> 10 punkter), 
    //ellers slår vi sammen alt (nyttig for små kommuner/bydeler)
    const pointsToCalculate = mainlandRing.length > 10 
        ? mainlandRing 
        : outerRings.flat();

    //Finn ytterpunktene (Min/Max)
    const longitudes = pointsToCalculate.map(p => p[0]);
    const latitudes = pointsToCalculate.map(p => p[1]);

    //Definerer hjørnene i bounding boksen eksplisitt
    const SW_lng = Math.min(...longitudes);
    const SW_lat = Math.min(...latitudes);
    const NE_lng = Math.max(...longitudes);
    const NE_lat = Math.max(...latitudes);

    //Returnerer i formatet MapTiler/Mapbox forventer for fitBounds
    return [
        [SW_lng, SW_lat], 
        [NE_lng, NE_lat]
    ];
}