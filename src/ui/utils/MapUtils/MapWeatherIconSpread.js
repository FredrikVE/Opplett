//src/ui/utils/MapUtils/MapWeatherIconSpread.js
import { MAP_ZOOM_LEVELS } from "./MapZoomLevels";

export function calculateWeatherIconSpread(zoom) {
    switch (true) {
        case (zoom <= MAP_ZOOM_LEVELS.COUNTRY):
            return 2.5;

        case (zoom <= MAP_ZOOM_LEVELS.CONTINENT_DETAIL):
            return 1.2;

        case (zoom <= MAP_ZOOM_LEVELS.REGION):
            return 0.5;

        case (zoom <= MAP_ZOOM_LEVELS.SUB_REGION):
            return 0.3;

        case (zoom <= MAP_ZOOM_LEVELS.COUNTY):
            return 0.15;

        case (zoom <= MAP_ZOOM_LEVELS.DISTRICT):
            return 0.08;

        case (zoom <= MAP_ZOOM_LEVELS.DEFAULT):
            return 0.04;

        default:
            return 0.001; // For gateplan og dypere zoom
    }
}