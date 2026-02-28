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

export default function useMapPageViewModel(getMapConfigUseCase, searchLocationUseCase, getMapWeatherUseCase, initialLat, initialLon) {

	const INIT_ZOOM = 12;
	const DEBOUNCE_DELAY_MS = 500;
	const [mapView, setMapView] = useState({bbox: null, zoom: INIT_ZOOM});
	const [location, setLocation] = useState({lat: initialLat, lon: initialLon, name: null, timezone: null});
	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);

	const { apiKey, style } = useMemo(() => {
		return getMapConfigUseCase.execute();
	}, [getMapConfigUseCase]);

	const tz = useMemo(() => {
		return resolveTimezone(location.timezone);
	}, [location.timezone]);

	//Oppdater location når GPS lander første gang
	useEffect(() => {
		if (initialLat != null && initialLon != null) {
			setLocation(prev => ({
				...prev,
				lat: initialLat,
				lon: initialLon
			}));
		}
	}, [initialLat, initialLon]);

	//Callback fra kartet – eneste kilde til viewport-endring
	const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {

		//Oppdaterer UI-location (header, search etc.)
		setLocation(prev => ({
			...prev,
			lat,
			lon
		}));

		//Oppdaterer viewport (SSOT for weather)
		setMapView({
			bbox,
			zoom: currentZoom
		});

	}, []);

	//Weather-fetch (viewport-drevet)
	useEffect(() => {

		if (!mapView.bbox) {
			return;
		}

		let cancelled = false;
		const minDist = calculateMinDist(mapView.zoom);

		const timer = setTimeout(async () => {

			setIsLoading(true);

			try {

				//Kun viewport brukes her
				const points = await getMapWeatherUseCase.execute(
					mapView.bbox,
					tz,
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

	}, 
	[mapView.bbox, mapView.zoom, tz, getMapWeatherUseCase]);


	return {
		apiKey,
		style,
		zoom: mapView.zoom,
		location,
		mapCenter: { lat: location.lat, lon: location.lon },
		weatherPoints,
		isLoading,
		onMapChange,

		// Search
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
	};
}