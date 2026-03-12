//src/ui/utils/MapUtils/MapConfig.js
export const MAP_CAMERA = {
    BOUNDS: "bounds",
    CENTER: "center"
};

export const MAP_HIGHLIGHT = {
    SOURCE_ID: "highlight-source",
    FILL_LAYER_ID: "highlight-fill",
    GLOW_LAYER_ID: "highlight-line-glow",
    LINE_LAYER_ID: "highlight-line-main"
};

export const LOCATION_TYPES = {
    CONTINENT: "continental_marine",
    MAJOR_LANDFORM: "major_landform",
    COUNTRY: "country",
    REGION: "region",
    SUBREGION: "subregion",
    COUNTY: "county",
    MUNICIPALITY: "municipality",
    CITY: "place",
    LOCALITY: "locality",
    NEIGHBOURHOOD: "neighbourhood",
    ADDRESS: "address"
};

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

export const MAP_ANIMATION = {
    DURATION_MS: 1500,
    FLY_SPEED: 1.2,
    PADDING: {
        AREA: 80,
        POINT: 40
    }
};

export const MAP_MARKER_CONFIG = {
    MAX_LAYOUT_MARKERS: 40,
    MAX_WEATHER_MARKERS: 20,
    LABEL_LAYERS: [
        "Capital city labels",
        "City labels",
        "Town labels",
        "Place labels"
    ]
};

export function isAreaLocation(type) {
    return [
        LOCATION_TYPES.CONTINENT,
        LOCATION_TYPES.MAJOR_LANDFORM,
        LOCATION_TYPES.COUNTRY,
        LOCATION_TYPES.REGION,
        LOCATION_TYPES.SUBREGION,
        LOCATION_TYPES.COUNTY,
        LOCATION_TYPES.MUNICIPALITY
    ].includes(type);
}

export function shouldUseSearchBounds(type) {
    return ![
        LOCATION_TYPES.COUNTRY,
        LOCATION_TYPES.CONTINENT,
        LOCATION_TYPES.MAJOR_LANDFORM
    ].includes(type);
}

export function getDefaultZoomForLocationType(type) {
    switch (type) {
        case LOCATION_TYPES.COUNTRY:
        case LOCATION_TYPES.MAJOR_LANDFORM:
            return MAP_ZOOM_LEVELS.COUNTRY;

        case LOCATION_TYPES.REGION:
            return MAP_ZOOM_LEVELS.REGION;

        case LOCATION_TYPES.SUBREGION:
        case LOCATION_TYPES.COUNTY:
            return MAP_ZOOM_LEVELS.COUNTY;

        case LOCATION_TYPES.CITY:
        case LOCATION_TYPES.MUNICIPALITY:
            return MAP_ZOOM_LEVELS.DISTRICT;

        case LOCATION_TYPES.ADDRESS:
        case LOCATION_TYPES.NEIGHBOURHOOD:
            return MAP_ZOOM_LEVELS.STREET;

        default:
            return MAP_ZOOM_LEVELS.DEFAULT;
    }
}

export function getMapConstraints(zoom) {
    let maxMarkers = MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS;

    if (zoom < 4) {
        maxMarkers = 10;
    } else if (zoom < 7) {
        maxMarkers = 12;
    }

    const baseDistance = 50;
    const minDistance = baseDistance / Math.pow(2, zoom);

    return {
        maxMarkers,
        minDistance
    };
}