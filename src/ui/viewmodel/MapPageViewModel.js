import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { getBoundsFromGeometry } from "../utils/MapUtils/MapBoundsHelper.js";
import { resolveMapCamera, getSearchBoundsForLocation } from "../utils/MapUtils/MapCamera.js";
import { isAreaLocation } from "../utils/MapUtils/MapConfig.js";

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
	const [searchBbox, setSearchBbox] = useState(null);
	const [viewport, setViewport] = useState(null);

	const stableMapTargetRef = useRef(null);

	/* =========================================================
	   COMMANDS
	========================================================= */
	const clearWeatherPoints = useCallback(() => {
		setWeatherPoints([]);
	}, []);

	const clearSearchBounds = useCallback(() => {
		setSearchBbox(null);
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
	}, 
    []);

	const setHighlightSuccess = useCallback((locationId, geojson) => {
		setHighlightState({
			status: "success",
			locationId,
			geojson: geojson ?? null
		});
	}, 
    []);

	const setHighlightError = useCallback((locationId) => {
		setHighlightState({
			status: "error",
			locationId,
			geojson: null
		});
	}, 
    []);

	const handleSuggestionSelected = useCallback((selected) => {
		console.log(`[MapPageVM] 🔍 Valgt: ${selected.name}`);
		clearWeatherPoints();
		setSearchBbox(getSearchBoundsForLocation(selected));
		onLocationChange(selected);
	}, 
    [clearWeatherPoints, onLocationChange]);

	const handleResetToDeviceLocation = useCallback(() => {
		clearWeatherPoints();
		clearSearchBounds();
		onResetToDeviceLocation();
	}, 
    [clearWeatherPoints, clearSearchBounds, onResetToDeviceLocation]);

	const onMapChange = useCallback(({ viewport, points }) => {
		setViewport(viewport ?? null);
		setMapPoints(points || []);

		//Brukeren har tatt kontroll over kameraet
		setSearchBbox((prev) => (
			prev ? null : prev
		));

		console.log(`[MapPageVM] 📥 onMapChange (Punkter: ${points?.length ?? 0})`);
	}, 
    []);

	/* =========================================================
	   CHILD VIEWMODELS
	========================================================= */
	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		handleSuggestionSelected,
		{ lat: activeLocation.lat, lon: activeLocation.lon },
		handleResetToDeviceLocation
	);

	/* =========================================================
	   SELECTORS / COMPUTED
	========================================================= */
	const highlightGeometry = useMemo(() => {
		if (!activeLocation?.id) return null;
		if (highlightState.locationId !== activeLocation.id) return null;
		return highlightState.geojson;
	}, [highlightState, activeLocation?.id]);

	const geometryBounds = useMemo(() => {
		return getBoundsFromGeometry(highlightGeometry);
	}, [highlightGeometry]);


	const candidateMapTarget = useMemo(() => {
		if (activeLocation?.lat == null || activeLocation?.lon == null) {
			return stableMapTargetRef.current;
		}

		const isArea = isAreaLocation(activeLocation?.type);
		const hasLocationId = Boolean(activeLocation?.id);
		const highlightBelongsToActiveLocation = highlightState.locationId === activeLocation?.id;
		const shouldWaitForGeometry = isArea && hasLocationId && ( !highlightBelongsToActiveLocation || highlightState.status === "loading");

		if (shouldWaitForGeometry) {
			return stableMapTargetRef.current;
		}

		return resolveMapCamera({
			location: activeLocation,
			geometryBounds,
			searchBounds: searchBbox
		});
	}, 
	[activeLocation, geometryBounds, searchBbox, highlightState.locationId, highlightState.status]);

	/*
	const candidateMapTarget = useMemo(() => {
		if (activeLocation?.lat == null || activeLocation?.lon == null) {
			return stableMapTargetRef.current;
		}

		const shouldWaitForGeometry =
			isAreaLocation(activeLocation?.type) &&
			activeLocation?.id &&
			highlightState.status === "loading";

		if (shouldWaitForGeometry) {
			return stableMapTargetRef.current;
		}

		return resolveMapCamera({
			location: activeLocation,
			geometryBounds,
			searchBounds: searchBbox
		});
	}, 
    [activeLocation, geometryBounds, searchBbox, highlightState.status]);
	*/

	const mapTarget = useMemo(() => {
		return candidateMapTarget ?? stableMapTargetRef.current;
	}, 
	[candidateMapTarget]);

	const currentZoom = useMemo(() => {
		return viewport?.zoom ?? mapTarget?.data?.zoom ?? null;
	}, 
	[viewport, mapTarget]);

	const mapConfig = useMemo(() => {
		return mapTilerRepository.getMapConfig();
	}, 
	[mapTilerRepository]);

	/* =========================================================
	   EFFECT ACTIONS
	========================================================= */
	const fetchHighlightGeometry = useCallback(async (locationId) => {
		return await getLocationGeometryUseCase.execute(locationId);
	}, 
	[getLocationGeometryUseCase]);

	const fetchWeatherPoints = useCallback(async (points, timezone) => {
		return await getMapWeatherUseCase.execute(points, timezone);
	}, 
	[getMapWeatherUseCase]);

	const syncStableMapTarget = useCallback(() => {
		if (candidateMapTarget?.id) {
			stableMapTargetRef.current = candidateMapTarget;
			console.log(`[MapPageVM] ✅ mapTarget SSOT: ${candidateMapTarget.id}`);
		}
	}, [candidateMapTarget]);

	/* =========================================================
	   EFFECTS
	========================================================= */
	const onActiveLocationIdChangedLoadHighlightGeometry = useCallback(() => {
		if (!activeLocation?.id) {
			resetHighlightState();
			return;
		}

		let cancelled = false;
		const locationId = activeLocation.id;

		setHighlightLoading(locationId);

		fetchHighlightGeometry(locationId)
			.then((geojson) => {
				if (cancelled) {
					return;
				}

				setHighlightSuccess(locationId, geojson);
			})
			.catch(() => {
				if (cancelled) {
					return;
				}
				
				setHighlightError(locationId);
			});

		return () => {
			cancelled = true;
		};
	}, 

    [activeLocation?.id, fetchHighlightGeometry, resetHighlightState, setHighlightLoading, setHighlightSuccess, setHighlightError]);


	const onCandidateMapTargetChangedSyncStableMapTarget = useCallback(() => {
		syncStableMapTarget();
	}, [syncStableMapTarget]);

	const onMapPointsOrTimezoneChangedLoadWeatherPoints = useCallback(() => {
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

	useEffect(onActiveLocationIdChangedLoadHighlightGeometry, 
        [onActiveLocationIdChangedLoadHighlightGeometry]
    );

	useEffect(onCandidateMapTargetChangedSyncStableMapTarget, 
        [onCandidateMapTargetChangedSyncStableMapTarget]
    );
    
	useEffect(onMapPointsOrTimezoneChangedLoadWeatherPoints, 
        [onMapPointsOrTimezoneChangedLoadWeatherPoints]
    );

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