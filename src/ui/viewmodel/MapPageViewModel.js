// src/ui/viewmodel/MapPageViewModel.js
//
// ViewModel for kartsiden.
//
// Endringer:
//   - Fjernet getBoundsFromGeometry-import og geometryBounds/searchBounds mellomvariabler
//   - resolveMapCamera tar kun { location }
//   - Fjernet viewport.zoom fallback (currentZoom er enklere)

import { useEffect, useState, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";

export default function useMapPageViewModel(
	mapTilerRepository,
	searchLocationUseCase,
	getMapWeatherUseCase,
	getLocationGeometryUseCase,
	activeLocation,
	onLocationChange,
	onResetToDeviceLocation
) {
	/* =========================================================
	   CONFIG
	========================================================= */
	const DEBOUNCE_DELAY_MS = 500;

	/* =========================================================
	   STATE
	========================================================= */
	const [highlightState, setHighlightState] = useState({
		status: "idle",
		locationId: null,
		geojson: null,
	});

	const [mapPoints, setMapPoints] = useState([]);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [currentZoom, setCurrentZoom] = useState(null);

	/* =========================================================
	   COMMANDS
	========================================================= */
	const clearWeatherPoints = useCallback(() => {
		setWeatherPoints([]);
	}, []);

	const resetHighlightState = useCallback(() => {
		setHighlightState({ status: "idle", locationId: null, geojson: null });
	}, []);

	const handleResetToDeviceLocation = useCallback(() => {
		clearWeatherPoints();
		onResetToDeviceLocation();
	}, [clearWeatherPoints, onResetToDeviceLocation]);

	const onMapChange = useCallback(({ viewport, points }) => {
		setCurrentZoom(viewport?.zoom ?? null);
		setMapPoints(points || []);
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

	// SSOT kamera — geometryBounds gir bedre sentrering for land
	const geometryBounds = getBoundsFromGeometry(highlightGeometry);
	const mapTarget = resolveMapCamera({ location: activeLocation, geometryBounds });

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

		return () => {
			cancelled = true;
		};
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
			} catch (error) {
				if (!cancelled) {
					console.error("[MapVM] Vær-feil:", error);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}, DEBOUNCE_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [mapPoints, activeLocation?.timezone, getMapWeatherUseCase]);

	/* =========================================================
	   PUBLIC API
	========================================================= */
	return {
		apiKey: mapConfig.apiKey,
		style: mapConfig.style,
		location: activeLocation,
		isLoading,
		mapTarget,
		highlightGeometry,
		weatherPoints,
		currentZoom,
		onMapChange,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: searchViewModel.onResetLocation,
	};
}