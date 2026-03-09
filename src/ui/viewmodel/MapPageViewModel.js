import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";

export default function useMapPageViewModel(
	mapTilerRepository,
	searchLocationUseCase,
	getMapWeatherUseCase,
	activeLocation,
	onLocationChange,
	onResetToDeviceLocation
) {

	const DEBOUNCE_DELAY_MS = 500;

	const DEFAULT_MAP_VIEW = {
		bbox: null,
		zoom: MAP_ZOOM_LEVELS.DEFAULT,
		lat: null,
		lon: null
	};

	// =========================
	// STATE
	// =========================

	const [mapView, setMapView] = useState(DEFAULT_MAP_VIEW);
	const [bboxToFit, setBboxToFit] = useState(null);
	const [mapPoints, setMapPoints] = useState([]);
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	console.log("[DEBUG VM] Init MapPageViewModel");

	// =========================
	// SEARCH PROXIMITY
	// =========================

	const searchProximity = {
		lat: activeLocation.lat,
		lon: activeLocation.lon
	};

	console.log("[DEBUG VM] Search proximity:", searchProximity);

	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		onLocationChange,
		searchProximity,
		onResetToDeviceLocation
	);

	// =========================
	// MAP CONFIG
	// =========================

	const { apiKey, style } = useMemo(() => {

		const config = mapTilerRepository.getMapConfig();

		console.log("[DEBUG VM] Map config loaded:", config);

		return config;

	}, [mapTilerRepository]);

	// =========================
	// TIMEZONE
	// =========================

	const tz = activeLocation.timezone;

	console.log("[DEBUG VM] Active timezone:", tz);

	// =========================
	// MAP CHANGE HANDLER
	// =========================

	const onMapChange = useCallback((lat, lon, bbox, currentZoom, points) => {

		console.log("[DEBUG VM] onMapChange mottatt:", {
			lat,
			lon,
			zoom: currentZoom,
			points: points.length
		});

		setBboxToFit(null);

		setMapPoints(points);

		setMapView({
			bbox,
			zoom: currentZoom,
			lat,
			lon
		});

	}, []);

	// =========================
	// WEATHER FETCH
	// =========================

	useEffect(() => {

		console.log("[DEBUG VM] Evaluating weather fetch conditions");
		console.log("[DEBUG VM] mapPoints:", mapPoints);

		if (mapPoints.length === 0 || !tz) {

			console.log("[DEBUG VM] STOP fetch: missing points or timezone");
			return;
		}

		let cancelled = false;

		console.log("[DEBUG VM] Scheduling weather fetch in", DEBOUNCE_DELAY_MS, "ms");

		const timer = setTimeout(async () => {

			if (cancelled) {
				console.log("[DEBUG VM] Fetch cancelled before execution");
				return;
			}

			setIsLoading(true);

			console.log("[DEBUG VM] Calling GetMapWeatherUseCase.execute()");
			console.log("[DEBUG VM] Points:", mapPoints.length);

			try {

				const results = await getMapWeatherUseCase.execute(
					mapPoints,
					tz
				);

				if (!cancelled) {

					console.log("[DEBUG VM] Weather points received:", results?.length);

					setWeatherPoints(results || []);
				}

			} catch (error) {

				console.error("[DEBUG VM] Weather fetch failed:", error);

			} finally {

				if (!cancelled) {
					setIsLoading(false);
				}
			}

		}, DEBOUNCE_DELAY_MS);

		return () => {

			console.log("[DEBUG VM] Cleanup weather fetch timer");

			cancelled = true;
			clearTimeout(timer);
		};

	}, [
		mapPoints,
		tz,
		getMapWeatherUseCase
	]);

	// =========================
	// MAP CENTER
	// =========================

	const mapCenter = {
		lat: mapView.lat ?? activeLocation.lat,
		lon: mapView.lon ?? activeLocation.lon
	};

	console.log("[DEBUG VM] Map center resolved:", mapCenter);

	// =========================
	// RETURN VIEWMODEL
	// =========================

	return {

		apiKey,
		style,

		zoom: mapView.zoom,

		bboxToFit,
		location: activeLocation,

		mapCenter,

		weatherPoints,
		isLoading,

		onMapChange,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,

		onSuggestionSelected: (selected) => {

			console.log("[DEBUG VM] Suggestion selected:", selected.name);

			onLocationChange(selected);

			searchViewModel.onSuggestionSelected(selected);

			const { zoom, bbox } = calculateMapView(selected);

			console.log("[DEBUG VM] Calculated map view:", { zoom, bbox });

			setBboxToFit(bbox);

			setMapView({
				bbox: bbox,
				zoom: zoom,
				lat: selected.lat,
				lon: selected.lon
			});
		},

		onResetToDeviceLocation: () => {

			console.log("[DEBUG VM] Resetting to device location");

			setBboxToFit(null);

			setMapView(DEFAULT_MAP_VIEW);

			onResetToDeviceLocation();

			searchViewModel.onResetLocation();
		}
	};
}