// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
	const DEBOUNCE_DELAY_MS = 500;

	// =========================
	// STATE
	// =========================
	const [mapView, setMapView] = useState({
		bbox: null,
		zoom: MAP_ZOOM_LEVELS.DEFAULT,
		lat: activeLocation.lat,
		lon: activeLocation.lon
	});
	
	const [bboxToFit, setBboxToFit] = useState(null);
	const [highlightGeometry, setHighlightGeometry] = useState(null);
	const [mapPoints, setMapPoints] = useState([]);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	// =========================
	// SSOT SYNKRONISERING
	// =========================
	useEffect(() => {
		if (activeLocation.lat && activeLocation.lon) {
			setMapView(prev => ({
				...prev,
				lat: activeLocation.lat,
				lon: activeLocation.lon
			}));
		}
	}, [activeLocation.lat, activeLocation.lon]);

	// =========================
	// SEARCH VIEWMODEL
	// =========================
	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		onLocationChange,
		{ lat: activeLocation.lat, lon: activeLocation.lon },
		onResetToDeviceLocation
	);

	// =========================
	// MAP CONFIG
	// =========================
	const { apiKey, style } = useMemo(() => {
		return mapTilerRepository.getMapConfig();
	}, [mapTilerRepository]);

	const tz = activeLocation.timezone;

	// =========================
	// MAP CHANGE HANDLER
	// =========================
	const onMapChange = useCallback((lat, lon, bbox, currentZoom, points) => {
		// Nullstiller bboxToFit så snart brukeren begynner å bevege kartet selv
		setBboxToFit(null);

		// Nå lar vi ALLTID kartet styre hvilke punkter som vises
		setMapPoints(points || []);

		setMapView({
			bbox,
			zoom: currentZoom,
			lat,
			lon
		});
	}, []);

	// =========================
	// WEATHER FETCH LOGIKK
	// =========================
	useEffect(() => {
		if (!mapPoints || mapPoints.length === 0 || !tz) {
			setWeatherPoints([]);
			return;
		}

		let cancelled = false;

		const timer = setTimeout(async () => {
			if (cancelled) return;

			setIsLoading(true);
			try {
				const results = await getMapWeatherUseCase.execute(mapPoints, tz);
				if (!cancelled) {
					setWeatherPoints(results || []);
				}
			} catch (error) {
				console.error("[VM] Feil ved henting av vær for kart:", error);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}, DEBOUNCE_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [mapPoints, tz, getMapWeatherUseCase]);

	// =======================================================
	// HighlightGeometri (Blå grenser for land/kommune)
	// =======================================================
	useEffect(() => {
		if (!activeLocation?.id) {
			setHighlightGeometry(null);
			return;
		}

		let cancelled = false;
		const loadGeometry = async () => {
			try {
				const geo = await getLocationGeometryUseCase.execute(activeLocation.id);
				if (!cancelled) setHighlightGeometry(geo);
			} catch (err) {
				console.error("[VM] Klarte ikke hente highlight-geometri:", err);
				if (!cancelled) setHighlightGeometry(null);
			}
		};

		loadGeometry();
		return () => { cancelled = true; };
	}, [activeLocation.id, getLocationGeometryUseCase]);

	// =========================
	// HANDLERS
	// =========================

	const handleSuggestionSelected = (selected) => {
		setWeatherPoints([]);
		setMapPoints([]);
		
		onLocationChange(selected);

		const { zoom, bbox } = calculateMapView(selected);
		
		setBboxToFit(bbox);
		setMapView({
			bbox: bbox,
			zoom: zoom,
			lat: selected.lat,
			lon: selected.lon
		});

		searchViewModel.onSuggestionSelected(selected);
	};

	const handleResetToDeviceLocation = () => {
		setWeatherPoints([]);
		setMapPoints([]);
		setBboxToFit(null);

		onResetToDeviceLocation();

		setMapView({
			bbox: null,
			zoom: MAP_ZOOM_LEVELS.DEFAULT,
			lat: activeLocation.lat,
			lon: activeLocation.lon
		});

		searchViewModel.onResetLocation();
	};

	return {
		apiKey,
		style,
		zoom: mapView.zoom,
		bboxToFit,
		location: activeLocation,
		highlightGeometry,
		mapCenter: {
			lat: mapView.lat ?? activeLocation.lat,
			lon: mapView.lon ?? activeLocation.lon
		},
		weatherPoints,
		isLoading,
		onMapChange,
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: handleSuggestionSelected,
		onResetToDeviceLocation: handleResetToDeviceLocation
	};
}