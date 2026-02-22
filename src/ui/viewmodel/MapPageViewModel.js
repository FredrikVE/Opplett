import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

export default function useMapPageViewModel(
	getMapConfigUseCase, 
	searchLocationUseCase, 
	getMapWeatherUseCase, 
	initialLat, 
	initialLon
) {
	const baseConfig = useMemo(() => getMapConfigUseCase.execute(), [getMapConfigUseCase]);
	const { defaultZoom, apiKey, style, defaultCenter } = baseConfig;

	// Lokasjon styres primært av søkefeltet eller GPS ved oppstart
	const [location, setLocation] = useState({
		lat: initialLat ?? defaultCenter.lat,
		lon: initialLon ?? defaultCenter.lon,
		name: null,
		timezone: null
	});

	// Denne staten holder styr på hva brukeren faktisk ser på kartet akkurat nå
	const [mapView, setMapView] = useState({
		lat: location.lat,
		lon: location.lon,
		bbox: null // [vest, sør, øst, nord]
	});

	const [weatherPoints, setWeatherPoints] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	const searchViewModel = useSearchViewModel(searchLocationUseCase, setLocation);
	const tz = useMemo(() => resolveTimezone(location.timezone), [location.timezone]);

	/**
	 * Callback som WeatherMap kaller på hver 'moveend' (når kartet stopper).
	 * Bruker useCallback for å unngå unødvendige re-renders av kartkomponenten.
	 */
	const onMapChange = useCallback((lat, lon, bbox) => {
		setMapView({ lat, lon, bbox });
	}, []);

	useEffect(() => {
		// Vi prioriterer mapView (utsnittet), men faller tilbake på location (søket)
		const targetLat = mapView.lat || location.lat;
		const targetLon = mapView.lon || location.lon;

		if (!targetLat || !targetLon) return;

		let cancelled = false;

		// DEBOUNCE: Vi venter 500ms før vi faktisk utfører de tunge API-kallene.
		// Dette fjerner "lugging" når man zoomer eller flytter kartet raskt.
		const timer = setTimeout(async () => {
			setIsLoading(true);
			try {
				const points = await getMapWeatherUseCase.execute(
					targetLat, 
					targetLon, 
					tz,
					mapView.bbox
				);

				if (!cancelled) {
					setWeatherPoints(points);
				}
			} catch (error) {
				console.error("Feil ved oppdatering av kart-vær:", error);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}, 500); 

		// Cleanup: Hvis mapView eller koordinater endres før 500ms har gått, 
		// avbryter vi den forrige timeren og starter en ny.
		return () => { 
			cancelled = true;
			clearTimeout(timer);
		};
	}, [mapView, tz, getMapWeatherUseCase, location.lat, location.lon]); 

	return {
		// Kart-konfigurasjon
		apiKey,
		style,
		zoom: defaultZoom,

		// Vær-punkter og tilstand
		location,
		timezone: tz,
		mapCenter: { lat: location.lat, lon: location.lon },
		weatherPoints,
		isLoading,
		onMapChange,

		// Søke-logikk
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
	};
}