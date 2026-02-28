// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";


// UI-logikk: Beregner tetthet av værikoner basert på zoom
function calculateMinDist(zoom) {
	if (zoom <= 3) return 2.5;
	if (zoom <= 5) return 1.2;
	if (zoom <= 7) return 0.5;
	if (zoom <= 9) return 0.15;
	if (zoom <= 11) return 0.04;
	if (zoom <= 13) return 0.01;
	return 0.001;
}

export default function useMapPageViewModel( getMapConfigUseCase, searchLocationUseCase, getMapWeatherUseCase, initialLat, initialLon) {

	const INIT_ZOOM = 12;
	const DEBOUNCE_DELAY_MS = 500;
	const [location, setLocation] = useState({ lat: initialLat, lon: initialLon, name: null, timezone: null });
	const [mapView, setMapView] = useState({ bbox: null, zoom: INIT_ZOOM });
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);

	const { apiKey, style } = useMemo(() => {
		return getMapConfigUseCase.execute();
	}, [getMapConfigUseCase]);


	const tz = useMemo(() => {
		return resolveTimezone(location.timezone);
	}, [location.timezone]);

	useEffect(() => {
		if (initialLat != null && initialLon != null) {
			setLocation(prev => ({
				...prev,
				lat: initialLat,
				lon: initialLon
			}));
		}
	}, [initialLat, initialLon]);

	const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {
		setLocation(prev => ({
			...prev,
			lat,
			lon
		}));

		setMapView({
			bbox,
			zoom: currentZoom
		});
	}, []);

	useEffect(() => {

		if (location.lat == null || location.lon == null) {
			return;
		}

		let cancelled = false;
		const minDist = calculateMinDist(mapView.zoom);

		const timer = setTimeout(async () => {

			setIsLoading(true);

			try {

				const points = await getMapWeatherUseCase.execute(
					location.lat,
					location.lon,
					tz,
					mapView.bbox,
					minDist
				);

				if (!cancelled) {
					setWeatherPoints(points);
				}

			} 

			catch (error) {

				console.error("Feil ved henting av kartvær:", error);

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

	}, [location.lat, location.lon, mapView.bbox, mapView.zoom, tz, getMapWeatherUseCase]);

	return {
		apiKey,
		style,
		zoom: mapView.zoom,
		location,
		mapCenter: { lat: location.lat, lon: location.lon },
		weatherPoints,
		isLoading,
		onMapChange,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
	};
}