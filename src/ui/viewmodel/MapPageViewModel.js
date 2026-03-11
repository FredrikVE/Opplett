// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/MapBoundsHelper.js";

/**
 * ViewModel for MapPage.
 * Håndterer logikk for kamerasynkronisering (mapTarget), søk-integrasjon,
 * henting av polygon-geometri og værpunkter i kartutsnittet.
 */
export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEBOUNCE_DELAY_MS = 500;

    // =========================
    // STATE
    // =========================
    const [highlightGeometry, setHighlightGeometry] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // SSOT for søke-utsnitt: Dette holder på bbox fra søket helt til kartet flyttes manuelt.
    const [searchBbox, setSearchBbox] = useState(null);

    // =========================
    // HANDLERS
    // =========================
    
    // Rapporterer status fra kartet (kalles fra moveend i WeatherMap)
    const onMapChange = useCallback((lat, lon, bbox, zoom, points) => {
        setMapPoints(points || []);
        // Når brukeren flytter kartet manuelt, slipper vi "låsen" fra søket/polygoner
        setSearchBbox(null);
    }, []);

    // Håndterer valg av sted fra søkefeltet
    const handleSuggestionSelected = useCallback((selected) => {
        // Tøm gamle værmarkører umiddelbart for bedre brukeropplevelse
        setWeatherPoints([]);
        
        // 1. Beregn utsnitt (bbox/zoom) fra valgt forslag umiddelbart
        const { bbox } = calculateMapView(selected);
        setSearchBbox(bbox);
        
        // 2. Oppdater global SSOT (App.jsx)
        onLocationChange(selected);
    }, [onLocationChange]);

    // Nullstiller til brukerens GPS-posisjon
    const handleResetToDeviceLocation = useCallback(() => {
        setWeatherPoints([]);
        setSearchBbox(null);
        onResetToDeviceLocation();
    }, [onResetToDeviceLocation]);

    // =========================
    // SØKE-INTEGRASJON
    // =========================
    // VIKTIG: Vi sender koordinatene RENT inn (activeLocation.lat/lon).
    // Hvis App.jsx har avsluttet loading, er disse verdiene tilstede.
    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        handleSuggestionSelected,
        { lat: activeLocation.lat, lon: activeLocation.lon },
        handleResetToDeviceLocation
    );

    // =========================
    // SSOT: MAP TARGET (Hvor kartet skal flytte seg)
    // =========================
    const mapTarget = useMemo(() => {
        const geoBounds = getBoundsFromGeometry(highlightGeometry);
        const { zoom, bbox: defaultBbox } = calculateMapView(activeLocation);

        // Prioriteringsrekkefølge for kamera-utsnitt:
        // 1. Polygon-geometri (F.eks. landegrenser)
        // 2. Søke-BBox (Fra forslag i søkefeltet)
        // 3. Standard-BBox (Basert på stedstype, f.eks. "city")
        const finalBbox = geoBounds || searchBbox || defaultBbox;

        return {
            id: activeLocation.id || `${activeLocation.lat}-${activeLocation.lon}`,
            type: finalBbox ? "bounds" : "center",
            data: finalBbox || { lat: activeLocation.lat, lon: activeLocation.lon, zoom },
            isArea: activeLocation.type === "country" || activeLocation.type === "region"
        };
    }, [activeLocation, highlightGeometry, searchBbox]);

    // Henter MapTiler-konfigurasjon (API-nøkkel og stil)
    const { apiKey, style } = useMemo(() => 
        mapTilerRepository.getMapConfig(), 
    [mapTilerRepository]);

    // =========================
    // SIDE EFFECTS
    // =========================

    // Effekt: Hent polygon-geometri (highlight) når lokasjonens ID endres
    useEffect(() => {
        if (!activeLocation?.id) { 
            setHighlightGeometry(null); 
            return; 
        }
        let cancelled = false;
        getLocationGeometryUseCase.execute(activeLocation.id)
            .then(geo => { if (!cancelled) setHighlightGeometry(geo); })
            .catch(() => { if (!cancelled) setHighlightGeometry(null); });
        return () => { cancelled = true; };
    }, [activeLocation.id, getLocationGeometryUseCase]);

    // Effekt: Hent værdata for punktene som er synlige på kartet
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
                if (!cancelled) setWeatherPoints(results || []);
            } catch (error) {
                console.error("[MapVM] Feil ved henting av værdata:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }, DEBOUNCE_DELAY_MS);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [mapPoints, activeLocation?.timezone, getMapWeatherUseCase]);

    // =========================
    // RETURN
    // =========================
    return {
        // Kart-konfig
        apiKey,
        style,
        
        // Tilstander
        location: activeLocation,
        isLoading,
        mapTarget,
        highlightGeometry,
        weatherPoints,
        
        // Handlere
        onMapChange,
        
        // Søk-integrasjon (Props til SearchField)
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: searchViewModel.onResetLocation
    };
}