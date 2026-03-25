import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";

/* =========================
	CONSTANTS
========================= */
const IDLE_HIGHLIGHT = { status: "idle", locationId: null, geojson: null };
const DEBOUNCE_DELAY_MS = 500;

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {

	/* =========================
		DERIVED INPUT
	========================= */
	const locationId = activeLocation?.id;
	const locationType = activeLocation?.type;
	const timezone = activeLocation?.timezone;

	const currentCoordinates = useMemo(() => ({
		lat: activeLocation.lat,
		lon: activeLocation.lon,
	}), [activeLocation.lat, activeLocation.lon]);

	/* =========================
		STATE
	========================= */
	const [highlightState, setHighlightState] = useState(IDLE_HIGHLIGHT);
	const [mapPoints, setMapPoints] = useState([]);
	const [viewportBounds, setViewportBounds] = useState(null);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [currentZoom, setCurrentZoom] = useState(null);

	const highlightConfirmedRef = useRef(false);

	/* =========================
		COMMANDS
	========================= */

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

	const loadWeather = useCallback(async (points, timezone) => {
		setIsLoading(true);

		try {
			const results = await getMapWeatherUseCase.execute(points, timezone);
			setWeatherPoints(results || []);
		} 
		
		catch (error) {
			console.error("[MapVM] Vær-feil:", error);
		} 
		
		finally {
			setIsLoading(false);
		}
	}, [getMapWeatherUseCase]);

	/* =========================
		CHILD VIEWMODELS
	========================= */

	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		onLocationChange,
		currentCoordinates,
		handleResetToDeviceLocation
	);

	/* =========================
		COMPUTED
	========================= */

	const highlightGeometry =
		locationId === highlightState.locationId
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

	/* =========================
		EFFECTS – LOCATION
	========================= */

	const onLocationChangedLoadGeometry = useCallback(() => {
		if (!locationId || !isAreaLocation(locationType)) {
			resetHighlightState();
			return;
		}

		let cancelled = false;

		const run = async () => {
			try {
				const geojson = await getLocationGeometryUseCase.execute(locationId);

				if (!cancelled) {
					setHighlightState({
						status: "success",
						locationId,
						geojson: geojson ?? null,
					});
				}
			}
			
			catch {
				if (!cancelled) {
					setHighlightState({
						status: "error",
						locationId,
						geojson: null,
					});
				}
			}
		};

		setHighlightState({
			status: "loading",
			locationId,
			geojson: null,
		});

		run();

		return () => {
			cancelled = true;
		};

	}, [locationId, locationType, getLocationGeometryUseCase, resetHighlightState]);

	/* =========================
		EFFECTS – WEATHER
	========================= */

	const onVisiblePointsChangedFetchWeather = useCallback(() => {
		if (!mapPoints.length || !timezone) {
			setWeatherPoints([]);
			return;
		}

		let cancelled = false;

		const timer = setTimeout(() => {
			if (!cancelled) {
				loadWeather(mapPoints, timezone);
			}
		}, 
		DEBOUNCE_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [mapPoints, timezone, loadWeather]);

	/* =========================
		EFFECTS – UI / VIEWPORT
	========================= */

	const onHighlightChangedResetConfirmation = useCallback(() => {
		if (!highlightGeometry) {
			highlightConfirmedRef.current = false;
		}
	}, [highlightGeometry]);

	const onViewportChangedHandleHighlightVisibility = useCallback(() => {
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

	/* =========================
		EFFECT BINDINGS
	========================= */

	useEffect(onLocationChangedLoadGeometry, [onLocationChangedLoadGeometry]);
	useEffect(onVisiblePointsChangedFetchWeather, [onVisiblePointsChangedFetchWeather]);
	useEffect(onHighlightChangedResetConfirmation, [onHighlightChangedResetConfirmation]);
	useEffect(onViewportChangedHandleHighlightVisibility, [onViewportChangedHandleHighlightVisibility]);

	return {
		apiKey: mapConfig.apiKey,
		style: mapConfig.style,
		mapTarget,
		onMapChange,
		currentZoom,

		location: activeLocation,
		countryCode,

		highlightGeometry,

		weatherPoints,
		isLoading,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: searchViewModel.onResetLocation,
	};
}