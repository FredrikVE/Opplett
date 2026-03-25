// src/ui/viewmodel/MapPageViewModel.js
//
// ViewModel for kartsiden.
//
// Koordinerer tre ansvarsområder:
//   1. Søk (delegert til SearchViewModel)
//   2. Highlight av land/region (geometri, overlap-sjekk, auto-fjerning)
//   3. Værhenting for synlige kartpunkter

import { useEffect, useState, useCallback, useRef } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";


export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
	
	/* =========================================================
	   CONSTANTS
	========================================================= */
	const IDLE_HIGHLIGHT = { status: "idle", locationId: null, geojson: null };
	const DEBOUNCE_DELAY_MS = 500;
	
	/* =========================================================
	   STATE
	========================================================= */
	const [highlightState, setHighlightState] = useState(IDLE_HIGHLIGHT);
	const [mapPoints, setMapPoints] = useState([]);
	const [viewportBounds, setViewportBounds] = useState(null);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [currentZoom, setCurrentZoom] = useState(null);

	// Har viewporten overlappet med geometrien minst én gang?
	// Forhindrer at highlight fjernes før flyTo har landet.
	const highlightConfirmedRef = useRef(false);

	/* =========================================================
	   COMMANDS
	========================================================= */
	const clearWeatherPoints = useCallback(() => {
		setWeatherPoints([]);
	}, []);

	const resetHighlightState = useCallback(() => {
		setHighlightState(IDLE_HIGHLIGHT);
	}, []);

	const handleResetToDeviceLocation = useCallback(() => {
		clearWeatherPoints();
		onResetToDeviceLocation();
	}, [clearWeatherPoints, onResetToDeviceLocation]);

	const onMapChange = useCallback(({ viewport, points }) => {
		setCurrentZoom(viewport?.zoom ?? null);
		setMapPoints(points || []);
		if (viewport?.bounds) {
			setViewportBounds(viewport.bounds);
		}
	}, []);

	/* =========================================================
	   CHILD VIEWMODELS
	========================================================= */
	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		onLocationChange,
		{ lat: activeLocation.lat, lon: activeLocation.lon },
		handleResetToDeviceLocation
	);

	/* =========================================================
	   COMPUTED
	========================================================= */
	const highlightGeometry =
		activeLocation?.id === highlightState.locationId
			? highlightState.geojson
			: null;

	const geometryBounds = getBoundsFromGeometry(highlightGeometry);

	const countryCode = highlightGeometry
		? activeLocation?.countryCode ?? null
		: null;

	const mapTarget = resolveMapCamera({
		location: activeLocation,
		geometryBounds,
	});

	const mapConfig = mapTilerRepository.getMapConfig();

	/* =========================================================
	   EFFECTS
	========================================================= */

	// Hent geometri for område-highlight
	useEffect(() => {
		if (!activeLocation?.id || !isAreaLocation(activeLocation?.type)) {
			resetHighlightState();
			return;
		}

		let cancelled = false;
		const locationId = activeLocation.id;

		setHighlightState({ status: "loading", locationId, geojson: null });

		getLocationGeometryUseCase
			.execute(locationId)
			.then((geojson) => {
				if (!cancelled) {
					setHighlightState({
						status: "success",
						locationId,
						geojson: geojson ?? null,
					});
				}
			})
			.catch(() => {
				if (!cancelled) {
					setHighlightState({ status: "error", locationId, geojson: null });
				}
			});

		return () => { cancelled = true; };
	}, [activeLocation?.id, activeLocation?.type, getLocationGeometryUseCase, resetHighlightState]);

	// Hent vær for synlige punkter (debounced)
	useEffect(() => {
		if (!mapPoints.length || !activeLocation?.timezone) {
			setWeatherPoints([]);
			return;
		}

		let cancelled = false;

		const timer = setTimeout(async () => {
			if (cancelled) return;

			setIsLoading(true);

			try {
				const results = await getMapWeatherUseCase.execute(
					mapPoints,
					activeLocation.timezone
				);
				if (!cancelled) {
					setWeatherPoints(results || []);
				}
			} 
			
			catch (error) {
				if (!cancelled) {
					console.error("[MapVM] Vær-feil:", error);
				}
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

	// Reset confirmed-flagg ved ny highlight
	useEffect(() => {
		if (!highlightGeometry) {
			highlightConfirmedRef.current = false;
		}
	}, 
	
	[highlightGeometry]);

	// Fjern highlight når brukeren scroller helt forbi landet
	useEffect(() => {
		if (!highlightGeometry || !viewportBounds || !geometryBounds) return;

		const [[geoW, geoS], [geoE, geoN]] = geometryBounds;
		const [[vpW, vpS], [vpE, vpN]] = viewportBounds;

		const noOverlap =
			vpE < geoW || vpW > geoE ||
			vpN < geoS || vpS > geoN;

		if (!noOverlap) {
			highlightConfirmedRef.current = true;
			return;
		}

		if (highlightConfirmedRef.current) {
			resetHighlightState();
		}
	}, [viewportBounds, highlightGeometry, geometryBounds, resetHighlightState]);

	/* =========================================================
	   PUBLIC API
	========================================================= */
	return {
		// Kart
		apiKey: mapConfig.apiKey,
		style: mapConfig.style,
		mapTarget,
		onMapChange,
		currentZoom,

		// Lokasjon
		location: activeLocation,
		countryCode,

		// Highlight
		highlightGeometry,

		// Vær
		weatherPoints,
		isLoading,

		// Søk
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: searchViewModel.onResetLocation,
	};
}