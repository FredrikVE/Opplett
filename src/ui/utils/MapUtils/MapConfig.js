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
    MAX_LAYOUT_MARKERS: 60,
    MAX_WEATHER_MARKERS: 25,

    LABEL_LAYERS: [
        "Capital city labels",
        "City labels",
        "Town labels",
        "Place labels"
    ],

    LABEL_LAYER_ZOOM_RANGE: {
        MIN: 1,
        MAX: 24
    },

    IDLE_REPORT_DEBOUNCE_MS: 300
};

export const MAP_MARKER_DISTRIBUTION = {
    BASE_DISTANCE_DEGREES: 45,

    // Kan fortsatt være nyttig som generell terskel,
    // men brukes ikke lenger til landsfiltrering.
    GLOBAL_ZOOM_THRESHOLD: 4.5,

    MAX_DISTANCE_CAP_DEGREES: 3.0,

    MARKER_LIMITS: {
        AREA: {
            FAR: 14,
            MID: 20,
            DEFAULT: MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS
        },
        POINT: {
            FAR: 12,
            MID: 18,
            DEFAULT: MAP_MARKER_CONFIG.MAX_WEATHER_MARKERS
        }
    },

    ZOOM_BREAKPOINTS: {
        FAR: MAP_ZOOM_LEVELS.COUNTRY,
        MID: MAP_ZOOM_LEVELS.SUB_REGION
    },

    MIN_DISTANCE_CAP_DEGREES: {
        AREA: 0.55,
        POINT: 0.01
    },

    SPACING_MULTIPLIERS: {
        AREA: {
            HORIZONTAL: 1.2,
            VERTICAL: 0.8
        },
        POINT: {
            HORIZONTAL: 1.8,
            VERTICAL: 0.9
        }
    }
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

export function getMapConstraints(zoom, locationType) {
    const isArea = isAreaLocation(locationType);
    const isGlobalView = zoom < MAP_MARKER_DISTRIBUTION.GLOBAL_ZOOM_THRESHOLD;

    const limitPolicy = isArea
        ? MAP_MARKER_DISTRIBUTION.MARKER_LIMITS.AREA
        : MAP_MARKER_DISTRIBUTION.MARKER_LIMITS.POINT;

    const minDistanceCap =
        (zoom > 8 && !isArea)
            ? 0.001
            : (
                isArea
                    ? MAP_MARKER_DISTRIBUTION.MIN_DISTANCE_CAP_DEGREES.AREA
                    : MAP_MARKER_DISTRIBUTION.MIN_DISTANCE_CAP_DEGREES.POINT
            );

    let maxMarkers = limitPolicy.DEFAULT;

    if (zoom < MAP_MARKER_DISTRIBUTION.ZOOM_BREAKPOINTS.FAR) {
        maxMarkers = limitPolicy.FAR;
    } 
    
    else if (zoom < MAP_MARKER_DISTRIBUTION.ZOOM_BREAKPOINTS.MID) {
        maxMarkers = limitPolicy.MID;
    }

    const rawMinDistance =
        MAP_MARKER_DISTRIBUTION.BASE_DISTANCE_DEGREES / Math.pow(2, zoom);

    const minDistance = Math.min(
        Math.max(rawMinDistance, minDistanceCap),
        MAP_MARKER_DISTRIBUTION.MAX_DISTANCE_CAP_DEGREES
    );

    return {
        maxMarkers,
        minDistance,
        isGlobalView
    };
}

export function getMapSpacingMultipliers(locationType) {
    return isAreaLocation(locationType)
        ? MAP_MARKER_DISTRIBUTION.SPACING_MULTIPLIERS.AREA
        : MAP_MARKER_DISTRIBUTION.SPACING_MULTIPLIERS.POINT;
}