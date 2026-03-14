// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {

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
		geojson: null
	});

	const [mapPoints, setMapPoints] = useState([]);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [viewport, setViewport] = useState(null);

	/* =========================================================
	   COMMANDS
	========================================================= */
	const clearWeatherPoints = useCallback(() => {
		setWeatherPoints([]);
		//setMapPoints([]);
	}, []);

	const resetHighlightState = useCallback(() => {
		setHighlightState({
			status: "idle",
			locationId: null,
			geojson: null
		});
	}, []);

	const setHighlightLoading = useCallback((locationId) => {
		setHighlightState({
			status: "loading",
			locationId,
			geojson: null
		});
	}, []);

	const setHighlightSuccess = useCallback((locationId, geojson) => {
		setHighlightState({
			status: "success",
			locationId,
			geojson: geojson ?? null
		});
	}, []);

	const setHighlightError = useCallback((locationId) => {
		setHighlightState({
			status: "error",
			locationId,
			geojson: null
		});
	}, []);

	const handleResetToDeviceLocation = useCallback(() => {

		clearWeatherPoints();
		onResetToDeviceLocation();

	}, [clearWeatherPoints, onResetToDeviceLocation]);

	const onMapChange = useCallback(({ viewport, points }) => {

		setViewport(viewport ?? null);
		setMapPoints(points || []);

		console.log(`[MapPageVM] 📥 onMapChange (Punkter: ${points?.length ?? 0})`);

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
	const highlightGeometry = activeLocation?.id === highlightState.locationId
			? highlightState.geojson
			: null;

	const geometryBounds = getBoundsFromGeometry(highlightGeometry);

	const searchBounds = activeLocation?.bounds ?? null;

	const mapTarget = resolveMapCamera({
		location: activeLocation,
		geometryBounds,
		searchBounds
	});

	const currentZoom =
		viewport?.zoom ??
		mapTarget?.data?.zoom ??
		null;

	const mapConfig = mapTilerRepository.getMapConfig();

	/* =========================================================
	   EFFECT HELPERS
	========================================================= */
	const fetchHighlightGeometry = useCallback(async (locationId) => {
		return await getLocationGeometryUseCase.execute(locationId);
	}, [getLocationGeometryUseCase]);

	const fetchWeatherPoints = useCallback(async (points, timezone) => {
		return await getMapWeatherUseCase.execute(points, timezone);
	}, [getMapWeatherUseCase]);

	/* =========================================================
	   EFFECTS
	========================================================= */
	useEffect(() => {

		if (!activeLocation?.id) {
			resetHighlightState();
			return;
		}

		if (!isAreaLocation(activeLocation?.type)) {
			resetHighlightState();
			return;
		}

		let cancelled = false;
		const locationId = activeLocation.id;

		setHighlightLoading(locationId);

		fetchHighlightGeometry(locationId)
			.then((geojson) => {

				if (cancelled) return;

				setHighlightSuccess(locationId, geojson);

			})
			.catch(() => {

				if (cancelled) return;

				setHighlightError(locationId);

			});

		return () => {
			cancelled = true;
		};

	}, 
	
	[activeLocation?.id, activeLocation?.type, fetchHighlightGeometry, resetHighlightState, setHighlightLoading, setHighlightSuccess, setHighlightError]);

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

				const results = await fetchWeatherPoints(
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
	[mapPoints, activeLocation?.timezone, fetchWeatherPoints]);

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
		onResetToDeviceLocation: searchViewModel.onResetLocation
	};

}