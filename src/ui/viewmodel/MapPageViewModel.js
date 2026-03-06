import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { calculateWeatherIconSpread } from "../utils/MapUtils/MapWeatherIconSpread.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {

    const DEBOUNCE_DELAY_MS = 500;
    const DEFAULT_MAP_VIEW = {
        bbox: null,
        zoom: MAP_ZOOM_LEVELS.DEFAULT,
        lat: null,
        lon: null
    };

    //State
    const [mapView, setMapView] = useState(DEFAULT_MAP_VIEW);
    const [bboxToFit, setBboxToFit] = useState(null);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    //Initialiserer søk med proximity fra SSOT
    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        onLocationChange,
        { lat: activeLocation.lat, lon: activeLocation.lon },   //ikke så glad i å ha dette som objekt litteral
        onResetToDeviceLocation
    );

    const { apiKey, style } = useMemo(() => {
        return mapTilerRepository.getMapConfig();
    }, [mapTilerRepository]);

    //Tidssonen kommer ferdig vasket fra activeLocation
    const tz = activeLocation.timezone;


    //Kartet sender endringer hit når brukeren panorerer eller zoomer
    const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {

        console.log("[DEBUG VM] onMapChange mottatt:", {
            lat,
            lon,
            zoom: currentZoom,
            hasBbox: !!bbox
        });

        setBboxToFit(null);

        setMapView({
            bbox,
            zoom: currentZoom,
            lat,
            lon
        });

    }, []);

    //Henter værdata for gjeldende kartutsnitt
    useEffect(() => {

        console.log("[DEBUG VM] Sjekker forutsetninger for vær-henting:", {
            hasBbox: !!mapView.bbox,
            hasTz: !!tz,
            tz: tz,
            zoom: mapView.zoom
        });

        if (!mapView.bbox || !tz) {
            console.log("[DEBUG VM] Stopper: Mangler BBOX eller Tidssone.");
            return;
        }

        let cancelled = false;

        const minDist = calculateWeatherIconSpread(mapView.zoom);

        console.log(`[DEBUG VM] Planlegger henting om ${DEBOUNCE_DELAY_MS}ms. minDist: ${minDist}`);

        const timer = setTimeout(async () => {

            if (cancelled) {
                return;
            }

            setIsLoading(true);

            console.log("[DEBUG VM] Kaller GetMapWeatherUseCase.execute()...");

            try {

                const points = await getMapWeatherUseCase.execute(
                    mapView.bbox,
                    tz,
                    minDist,
                    activeLocation,
                    mapView.zoom
                );

                if (!cancelled) {

                    console.log(
                        `[DEBUG VM] Suksess! Mottok ${points?.length || 0} punkter.`
                    );

                    setWeatherPoints(points || []);
                }

            } 
            catch (error) {
                console.error("[DEBUG VM] Feil i fetch-prosessen:", error);

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

    }, [mapView.bbox, mapView.zoom, tz, getMapWeatherUseCase, activeLocation]);

    return {
        apiKey,
        style,
        zoom: mapView.zoom,
        bboxToFit,
        location: activeLocation,

        mapCenter: { lat: mapView.lat ?? activeLocation.lat, lon: mapView.lon ?? activeLocation.lon},

        weatherPoints,
        isLoading,
        onMapChange,

        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,

        onSuggestionSelected: (selected) => {

            console.log("[DEBUG VM] Forslag valgt:", selected.name);

            onLocationChange(selected);
            searchViewModel.onSuggestionSelected(selected);

            const { zoom, bbox } = calculateMapView(selected);

            setBboxToFit(bbox);

            setMapView(prev => ({
                ...prev,
                zoom: zoom,
                lat: selected.lat,
                lon: selected.lon
            }));

        },

        onResetToDeviceLocation: () => {
            console.log("[DEBUG VM] Resetter til GPS.");
            setBboxToFit(null);
            setMapView(DEFAULT_MAP_VIEW);  //Nullstiller kartvisningen slik at activeLocation overtar
            onResetToDeviceLocation();
            searchViewModel.onResetLocation();
        }
    };
}