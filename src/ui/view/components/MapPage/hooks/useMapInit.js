// src/ui/view/components/MapPage/hooks/useMapTilerInit.js
import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MAP_DEFAULTS, MAP_ZOOM_LEVELS } from "../../../../utils/MapUtils/Constants/MapConstants.js";

export function useMapInit(mapContainerRef, apiKey, style, mapTarget, activeLocation) {
    const [mapInstance, setMapInstance] = useState(null);
    const isInitialized = useRef(false);

    //Frys startverdiene i refs slik at de ikke trigger re-renders
    const initialLonRef = useRef(mapTarget?.data?.lon ?? activeLocation?.lon ?? MAP_DEFAULTS.CENTER_LON);
    const initialLatRef = useRef(mapTarget?.data?.lat ?? activeLocation?.lat ?? MAP_DEFAULTS.CENTER_LAT);
    const initialZoomRef = useRef(mapTarget?.data?.zoom ?? MAP_ZOOM_LEVELS.COUNTRY);

    useEffect(() => {
        if (!mapContainerRef.current || isInitialized.current) {
            return;
        }

        isInitialized.current = true;
        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            center: [initialLonRef.current, initialLatRef.current],
            zoom: initialZoomRef.current,
            attributionControl: false,
            navigationControl: true,
            geolocateControl: false
        });

        map.on("load", () => {
            setMapInstance(map);
        });

        return () => {
            map.remove();
            isInitialized.current = false;
            setMapInstance(null);
        };
        
    }, 
    //[apiKey, style, mapContainerRef]);
    [apiKey, style]);

    return mapInstance;
}