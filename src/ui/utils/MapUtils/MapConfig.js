//src/ui/utils/MapUtils/MapConfig.js
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
        AREA: 80,    // For land/fylker
        POINT: 40    // For byer/adresser
    }
};

export const MAP_MARKER_CONFIG = {
    MAX_COUNT: 40,
    LABEL_LAYERS: ["Capital city labels", "City labels", "Town labels", "Place labels"]
};

// SSOT: Sentral funksjon for kart-begrensninger (Gull-formelen din)
export function getMapConstraints(zoom) {
    let maxMarkers = 20;
    if (zoom < 4) maxMarkers = 10;
    else if (zoom < 7) maxMarkers = 12;

    const baseDistance = 50; 
    const minDistance = baseDistance / Math.pow(2, zoom);

    return { maxMarkers, minDistance };
}