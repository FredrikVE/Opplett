//src/ui/utils/MapUtils/MapConfig.js
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

// SSOT: Sentral funksjon for kart-begrensninger
export function getMapConstraints(zoom) {
    //Maks antall ikoner totalt på skjermen
    let maxMarkers = 15;
    if (zoom < 4) maxMarkers = 6;
    else if (zoom < 7) maxMarkers = 10;

    //Avstand mellom ikoner (Gull-formelen din)
    const baseDistance = 50; 
    const minDistance = baseDistance / Math.pow(2, zoom);

    return { maxMarkers, minDistance };
}

export const SPATIAL_FILTER = {
    [MAP_ZOOM_LEVELS.CONTINENT]: 10.0, // Meget strengt (kun et par byer i hele Europa)
    [MAP_ZOOM_LEVELS.COUNTRY]: 5.5,    // Kun f.eks. Oslo, Bergen, Trondheim samtidig
    [MAP_ZOOM_LEVELS.REGION]: 2.5,     // Mellomting
    [MAP_ZOOM_LEVELS.COUNTY]: 1.2      // Tettere i fylket
};