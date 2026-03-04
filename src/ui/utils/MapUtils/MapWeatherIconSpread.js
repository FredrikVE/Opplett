//src/ui/utils/MapUtils/MapWeatherIconSpread.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateWeatherIconSpread(zoom) {
    switch (true) {
        //Zoom <= 3 (Landsoversikt)
        case (zoom <= MAP_ZOOM_LEVELS.COUNTRY):
            return 2.5;

        //Zoom <= 6 (Region/Fylke) - Tilsvarer ca gamle 5-7
        case (zoom <= MAP_ZOOM_LEVELS.REGION):
            return 0.5;

        //Zoom <= 8 (Kommune) - Tilsvarer ca gamle 9
        case (zoom <= MAP_ZOOM_LEVELS.COUNTY):
            return 0.15;

        //Zoom <= 10 (Bydel/Distrikt) - Tilsvarer ca gamle 11
        case (zoom <= MAP_ZOOM_LEVELS.DISTRICT):
            return 0.04;

        //Zoom <= 12 (By/Adresse - Her er du på bilde 2!)
        case (zoom <= MAP_ZOOM_LEVELS.DEFAULT):
            return 0.01;

        //Alt dypere enn zoom 12 (f.eks STREET på 14)
        default:
            return 0.003; 
    }
}