//src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveMapCamera } from "../utils/MapUtils/Camera/CameraPolicy.js";
import { isAreaLocation } from "../utils/MapUtils/Camera/MapLocationLogic.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/Camera/MapBoundsHelper.js";
import { LAYER_KEYS } from "../view/components/MapPage/MapLayerToggle/MapToggleConfig.js";

/* =========================
	CONSTANTS
========================= */
const IDLE_HIGHLIGHT = { status: "idle", locationId: null, geojson: null };
const DEBOUNCE_DELAY_MS = 500;

const INITIAL_PRECIP_TIMELINE = {
	startMs: 0,
	endMs: 0,
	currentMs: 0,
	isPlaying: false,
};

export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, getLocationGeometryUseCase, activeLocation, deviceCoords, onLocationChange, onResetToDeviceLocation) {

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

	// Kartlag-state
	const [activeLayer, setActiveLayer] = useState(LAYER_KEYS.NONE);
	const [showMarkersWithLayer, setShowMarkersWithLayer] = useState(true);

	// Nedbør-tidslinje state
	const [precipTimeline, setPrecipTimeline] = useState(INITIAL_PRECIP_TIMELINE);

	// Teller som tvinger nytt mapTarget selv når lokasjonen er uendret
	const [resetCounter, setResetCounter] = useState(0);

	const highlightConfirmedRef = useRef(false);
	const previousMapTargetRef = useRef(null);
	const mapStyle = mapTilerRepository.getMapStyle();

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
		setResetCounter(prev => prev + 1);
		previousMapTargetRef.current = null;
		onResetToDeviceLocation();
	}, [clearWeatherPoints, onResetToDeviceLocation]);

	const onMapChange = useCallback(({ viewport, points }) => {
		setCurrentZoom(viewport?.zoom ?? null);
		setMapPoints(points || []);

		if (viewport?.bounds) {
			setViewportBounds(viewport.bounds);
		}
	}, []);

	const onLayerChange = useCallback((layerKey) => {
		setActiveLayer(layerKey);

		// Nullstill tidslinja når man bytter bort fra nedbør
		if (layerKey !== LAYER_KEYS.PRECIPITATION) {
			setPrecipTimeline(INITIAL_PRECIP_TIMELINE);
		}
	}, []);

	const onToggleMarkers = useCallback(() => {
		setShowMarkersWithLayer(prev => !prev);
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
		PRECIPITATION TIMELINE COMMANDS
	========================= */

	/**
	 * Callback som precipitation-hooken kaller for å oppdatere tidslinje-state.
	 * Bruker "functional update" for å unngå stale closures.
	 */
	const onPrecipTimeUpdate = useCallback((event) => {
		switch (event.type) {
			case "ready":
				setPrecipTimeline({
					startMs: event.startMs,
					endMs: event.endMs,
					currentMs: event.currentMs,
					isPlaying: event.isPlaying,
				});
				break;

			case "tick":
			case "seek":
				setPrecipTimeline(prev => ({
					...prev,
					currentMs: event.currentMs,
					isPlaying: event.isPlaying,
				}));
				break;

			case "removed":
				setPrecipTimeline(INITIAL_PRECIP_TIMELINE);
				break;

			default:
				break;
		}
	}, []);

	const onPrecipPlay = useCallback(() => {
		setPrecipTimeline(prev => ({ ...prev, isPlaying: true }));
	}, []);

	const onPrecipPause = useCallback(() => {
		setPrecipTimeline(prev => ({ ...prev, isPlaying: false }));
	}, []);

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

	const mapTarget = useMemo(() => {
		const next = resolveMapCamera({
			location: activeLocation,
			geometryBounds,
		});

		if (!next) {
			return null;
		}

		const prev = previousMapTargetRef.current;

		const sameLocation = prev
			&& activeLocation.id === prev._locationId;

		if (sameLocation && !geometryBounds) {
			return prev;
		}

		const target = {
			...next,
			id: `${next.id}-reset${resetCounter}`,
			_locationId: activeLocation.id,
		};

		previousMapTargetRef.current = target;
		return target;
	}, [activeLocation, geometryBounds, resetCounter]);

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
		if (!highlightGeometry || !viewportBounds || !geometryBounds) {
			return;
		}

		const [[geoWest, geoSouth], [geoEast, geoNorth]] = geometryBounds;
		const [[vpWest, vpSouth], [vpEast, vpNorth]] = viewportBounds;

		const highlightOutsideViewport =
			vpEast < geoWest || vpWest > geoEast ||
			vpNorth < geoSouth || vpSouth > geoNorth;

		if (!highlightOutsideViewport) {
			highlightConfirmedRef.current = true;
			return;
		}

		if (highlightConfirmedRef.current) {
			resetHighlightState();
		}
	}, 
	
	[viewportBounds, highlightGeometry, geometryBounds, resetHighlightState]);



	/* =========================
		EFFECT BINDINGS
	========================= */
	useEffect(onLocationChangedLoadGeometry, [onLocationChangedLoadGeometry]);
	useEffect(onVisiblePointsChangedFetchWeather, [onVisiblePointsChangedFetchWeather]);
	useEffect(onHighlightChangedResetConfirmation, [onHighlightChangedResetConfirmation]);
	useEffect(onViewportChangedHandleHighlightVisibility, [onViewportChangedHandleHighlightVisibility]);

	return {
		mapStyle,
		mapTarget,
		onMapChange,
		currentZoom,

		activeLocation,
		deviceCoords,
		countryCode,

		highlightGeometry,

		weatherPoints,
		isLoading,

		// Kartlag
		activeLayer,
		onLayerChange,
		showMarkersWithLayer,
		onToggleMarkers,

		// Nedbør-tidslinje
		precipTimeline,
		onPrecipTimeUpdate,
		onPrecipPlay,
		onPrecipPause,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: searchViewModel.onResetLocation,
	};
}