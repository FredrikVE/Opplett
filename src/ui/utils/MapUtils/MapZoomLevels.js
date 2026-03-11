//src/ui/utils/MapUtils/MapZoomLevels.js
export const MAP_ZOOM_LEVELS = {
    CONTINENT: 2,       //Kontinenter 
    //COUNTRY: 3,         // Oversikt over land
    COUNTRY: 4,         // Oversikt over land
    REGION: 6,           // Fylke
    SUB_REGION: 7,       // Stor-Oslo / Regioner
    COUNTY: 8,           // Kommune
    DISTRICT: 10,        // Bydeler / Større tettsteder
    DEFAULT: 12,         // By / Sentrum / Adresse
    STREET: 14           // Detaljert gateplan
};

export const SPATIAL_FILTER = {
    [MAP_ZOOM_LEVELS.COUNTRY]: 1.2, // Ved zoom 4 (og utover): Stor avstand
    [MAP_ZOOM_LEVELS.REGION]: 0.6,  // Ved zoom 6: Mellomstor avstand
    [MAP_ZOOM_LEVELS.COUNTY]: 0.2   // Ved zoom 8: Tettere
};