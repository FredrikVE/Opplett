// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/MapBoundsHelper.js";
import { MAP_CAMERA,LOCATION_TYPES } from "../utils/MapUtils/MapConfig.js";


export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {

    const DEBOUNCE_DELAY_MS = 500;

    /* =========================================================
       STATE
    ========================================================= */
    const [highlightGeometry, setHighlightGeometry] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchBbox, setSearchBbox] = useState(null);     // bbox fra søk – beholdes til bruker flytter kartet

    /* =========================================================
       MAP EVENT HANDLERS
    ========================================================= */
    const onMapChange = useCallback((lat, lon, bbox, zoom, points) => {
        setMapPoints(points || []);
        setSearchBbox(null);
    }, []);

    /* =========================================================
       SEARCH HANDLERS
    ========================================================= */
    const handleSuggestionSelected = useCallback((selected) => {
        setWeatherPoints([]);
        const { bbox } = calculateMapView(selected);
        setSearchBbox(bbox);
        onLocationChange(selected);
    }, [onLocationChange]);


    const handleResetToDeviceLocation = useCallback(() => {
        setWeatherPoints([]);
        setSearchBbox(null);
        onResetToDeviceLocation();
    }, [onResetToDeviceLocation]);



    /* =========================================================
       SEARCH VIEWMODEL
    ========================================================= */
    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        handleSuggestionSelected,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        handleResetToDeviceLocation
    );

    /* =========================================================
       MAP TARGET (SSOT for kamera)
    ========================================================= */

    const mapTarget = useMemo(() => {

        const geoBounds = getBoundsFromGeometry(highlightGeometry);

        const { zoom, bbox: defaultBbox } =
            calculateMapView(activeLocation);

        const finalBbox =
            geoBounds ??
            defaultBbox ??
            searchBbox;

        const isArea =
            activeLocation.type === LOCATION_TYPES.COUNTRY ||
            activeLocation.type === LOCATION_TYPES.REGION;

        const locationId = activeLocation.id ?? `${activeLocation.lat}-${activeLocation.lon}`;
        const geometryKey = highlightGeometry?.features?.length ? "geometry" : "no-geometry";

        return {

            id: `${locationId}-${geometryKey}`,

            type:
                finalBbox
                    ? MAP_CAMERA.BOUNDS
                    : MAP_CAMERA.CENTER,

            data:
                finalBbox ??
                {
                    lat: activeLocation.lat,
                    lon: activeLocation.lon,
                    zoom
                },

            isArea

        };

    }, [activeLocation, highlightGeometry, searchBbox]);

    /*
    const mapTarget = useMemo(() => {

        const geoBounds = getBoundsFromGeometry(highlightGeometry);
        const { zoom, bbox: defaultBbox } = calculateMapView(activeLocation);

        const finalBbox =
            geoBounds ??
            searchBbox ??
            defaultBbox;


        const isArea =
            activeLocation.type === LOCATION_TYPES.COUNTRY ||
            activeLocation.type === LOCATION_TYPES.REGION;

        const locationId =
            activeLocation.id ??
            `${activeLocation.lat}-${activeLocation.lon}`;

        const geometryKey =
            highlightGeometry?.features?.length
                ? "geometry"
                : "no-geometry";

        return {

            id: `${locationId}-${geometryKey}`,

            type:
                finalBbox
                    ? MAP_CAMERA.BOUNDS
                    : MAP_CAMERA.CENTER,

            data:
                finalBbox ||
                {
                    lat: activeLocation.lat,
                    lon: activeLocation.lon,
                    zoom
                },

            isArea

        };

    }, [activeLocation, highlightGeometry, searchBbox]);
    */
    /*
    const mapTarget = useMemo(() => {
        const geoBounds = getBoundsFromGeometry(highlightGeometry);
        const { zoom, bbox: defaultBbox } = calculateMapView(activeLocation);


        const finalBbox =
            geoBounds ||
            searchBbox ||
            defaultBbox;


        const isArea =
            activeLocation.type === LOCATION_TYPES.COUNTRY ||
            activeLocation.type === LOCATION_TYPES.REGION;


        return {

            id:
                //activeLocation.id || `${activeLocation.lat}-${activeLocation.lon}`,
                `${activeLocation.id || `${activeLocation.lat}-${activeLocation.lon}`}-${highlightGeometry ? "geo" : "no-geo"}`,

            type:
                finalBbox
                    ? MAP_CAMERA.BOUNDS
                    : MAP_CAMERA.CENTER,

            data:
                finalBbox || { 
                    lat: activeLocation.lat, 
                    lon: activeLocation.lon, 
                    zoom
                },
            isArea
        };

    }, [activeLocation, highlightGeometry, searchBbox]);
    */


    /* =========================================================
       MAP CONFIG
    ========================================================= */
    const { apiKey, style } = useMemo(
        () => mapTilerRepository.getMapConfig(),
        [mapTilerRepository]
    );


    /* =========================================================
       LOAD LOCATION GEOMETRY
    ========================================================= */
    useEffect(() => {

        if (!activeLocation?.id) {
            setHighlightGeometry(null);
            return;
        }

        let cancelled = false;

        getLocationGeometryUseCase
            .execute(activeLocation.id)

            .then(geo => {
                if (!cancelled) {
                    setHighlightGeometry(geo);
                }
            })

            .catch(() => {
                if (!cancelled) {
                    setHighlightGeometry(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, 
    [activeLocation.id, getLocationGeometryUseCase]);


    /* =========================================================
       LOAD WEATHER FOR MAP POINTS
    ========================================================= */
    useEffect(() => {

        if (!mapPoints.length || !activeLocation?.timezone) {
            setWeatherPoints([]);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {

            setIsLoading(true);

            try {
                const results = await getMapWeatherUseCase.execute(mapPoints, activeLocation.timezone);

                if (!cancelled) {
                    setWeatherPoints(results || []);
                }
            } 

            catch (error) {
                console.error("[MapVM] Feil ved henting av værdata:", error);
            }

            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, 
    [mapPoints, activeLocation?.timezone, getMapWeatherUseCase]);



    /* =========================================================
       RETURN
    ========================================================= */
    return {

        apiKey,
        style,
        location: activeLocation,

        isLoading,
        mapTarget,

        highlightGeometry,
        weatherPoints,
        onMapChange,

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: searchViewModel.onResetLocation
    };
}