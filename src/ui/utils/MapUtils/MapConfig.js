//src/ui/utils/MapUtils/MapConfig.js

/* =========================================================
   MAP CAMERA TYPES
   (unngå "stringly typed" kode)
========================================================= */
export const MAP_CAMERA = {
    BOUNDS: "bounds",
    CENTER: "center"
};


/* =========================================================
   MAP LOCATION TYPES
   (fra MapTiler Geocoding API)
========================================================= */
export const LOCATION_TYPES = {
    CONTINENT: "continental_marine",
    MAJOR_LANDFORM: "major_landform",
    COUNTRY: "country",
    REGION: "region",
    SUBREGION: "subregion",
    COUNTY: "county",
    MUNICIPALITY: "municipality",
    CITY: "place",
    //CITY: "city",
    LOCALITY: "locality",
    NEIGHBOURHOOD: "neighbourhood",
    ADDRESS: "address"
};


/* =========================================================
   MAP ZOOM LEVELS
========================================================= */
export const MAP_ZOOM_LEVELS = {
    CONTINENT: 2,
    COUNTRY: 4,
    REGION: 6,
    SUB_REGION: 7,
    COUNTY: 8,
    DISTRICT: 10,
    DEFAULT: 12,
    STREET: 14
};


/* =========================================================
   MAP ANIMATION CONFIG
========================================================= */
export const MAP_ANIMATION = {
    DURATION_MS: 1500,
    FLY_SPEED: 1.2,

    PADDING: {
        AREA: 80,   // land, regioner
        POINT: 40   // byer, adresser
    }
};


/* =========================================================
   MARKER CONFIG
========================================================= */
export const MAP_MARKER_CONFIG = {

    // Hvor mange labels MapTiler-layouten får jobbe med
    MAX_LAYOUT_MARKERS: 40,

    // Maks antall værmarkører vi faktisk viser
    MAX_WEATHER_MARKERS: 20,

    // MapTiler label layers som inneholder bynavn
    LABEL_LAYERS: [
        "Capital city labels",
        "City labels",
        "Town labels",
        "Place labels"
    ]
};


/* =========================================================
   MARKER DISTRIBUTION CONSTRAINTS
   (din "gullformel" for spredning av byer)
========================================================= */
export function getMapConstraints(zoom) {

    let maxMarkers = MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS;

    if (zoom < 4) {
        maxMarkers = 10;
    }
    else if (zoom < 7) {
        maxMarkers = 12;
    }

    const baseDistance = 50;

    const minDistance =
        baseDistance /
        Math.pow(2, zoom);

    return {
        maxMarkers,
        minDistance
    };
}