// src/ui/viewmodel/MapPageViewModel.js
//
// ViewModel for kartsiden.
//
// Endringer:
//   - Fjernet getBoundsFromGeometry-import og geometryBounds/searchBounds mellomvariabler
//   - resolveMapCamera tar kun { location }
//   - Fjernet viewport.zoom fallback (currentZoom er enklere)

import { useEffect, useState, useCallback, useRef } from "react";
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
	onResetToDeviceLocation,
	userCoords
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
	const [viewportBounds, setViewportBounds] = useState(null);
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

	console.log("[MapVM] Highlight:", highlightGeometry ? `AKTIV for "${activeLocation?.name}" (${highlightState.locationId})` : "INGEN", 
		"| state:", highlightState.status,
		"| location.id:", activeLocation?.id,
		"| state.locationId:", highlightState.locationId
	);

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

	// Fjern highlight når kartets viewport ikke lenger overlapper med landet.
	// highlightConfirmedRef sikrer at vi ikke fjerner highlight før kartet
	// faktisk har vist landet (minst én overlapp-sjekk har passert).
	const highlightConfirmedRef = useRef(false);

	// Reset confirmed-flagget når highlight endres
	useEffect(() => {
		if (!highlightGeometry) {
			highlightConfirmedRef.current = false;
		}
	}, [highlightGeometry]);

	useEffect(() => {
		if (!highlightGeometry || !viewportBounds) return;

		const geoBounds = getBoundsFromGeometry(highlightGeometry);
		if (!geoBounds) return;

		const [[geoW, geoS], [geoE, geoN]] = geoBounds;
		const [[vpW, vpS], [vpE, vpN]] = viewportBounds;

		const noOverlap =
			vpE < geoW || vpW > geoE ||
			vpN < geoS || vpS > geoN;

		if (!noOverlap) {
			// Viewporten overlapper med landet — bekreft at highlighten er "sett"
			highlightConfirmedRef.current = true;
			console.log("[MapVM] Overlap-sjekk: overlapper → beholder",
				"| geo:", [geoW.toFixed(1), geoS.toFixed(1), geoE.toFixed(1), geoN.toFixed(1)].join(", "),
				"| vp:", [vpW.toFixed(1), vpS.toFixed(1), vpE.toFixed(1), vpN.toFixed(1)].join(", ")
			);
			return;
		}

		// Ingen overlapp — men fjern bare hvis highlighten er bekreftet
		// (kartet har faktisk vist landet minst én gang)
		if (highlightConfirmedRef.current) {
			console.log("[MapVM] Overlap-sjekk: INGEN OVERLAPP → fjerner highlight",
				"| geo:", [geoW.toFixed(1), geoS.toFixed(1), geoE.toFixed(1), geoN.toFixed(1)].join(", "),
				"| vp:", [vpW.toFixed(1), vpS.toFixed(1), vpE.toFixed(1), vpN.toFixed(1)].join(", ")
			);
			resetHighlightState();
		} else {
			console.log("[MapVM] Overlap-sjekk: ingen overlapp, men venter på flyTo",
				"| geo:", [geoW.toFixed(1), geoS.toFixed(1), geoE.toFixed(1), geoN.toFixed(1)].join(", "),
				"| vp:", [vpW.toFixed(1), vpS.toFixed(1), vpE.toFixed(1), vpN.toFixed(1)].join(", ")
			);
		}
	}, [viewportBounds, highlightGeometry, resetHighlightState]);

	/* =========================================================
	   PUBLIC API
	========================================================= */
	return {
		apiKey: mapConfig.apiKey,
		style: mapConfig.style,
		location: activeLocation,
		userCoords,
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