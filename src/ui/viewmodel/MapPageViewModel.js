// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { calculateMapView } from "../utils/MapUtils/MapZoomHelper.js";
import { calculateWeatherIconSpread } from "../utils/MapUtils/MapWeatherIconSpread.js";
import { MAP_ZOOM_LEVELS } from "../utils/MapUtils/MapZoomLevels.js";


export default function useMapPageViewModel(mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEBOUNCE_DELAY_MS = 500;

    // State
    const [mapView, setMapView] = useState({ bbox: null, zoom: MAP_ZOOM_LEVELS.DEFAULT });
    const [bboxToFit, setBboxToFit] = useState(null);
    const [localLocation, setLocalLocation] = useState(activeLocation);
    const [weatherPoints, setWeatherPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

	//Synkroniser lokasjon når brukeren søker eller bytter sted i en annen tab
	useEffect(() => {
		setLocalLocation(activeLocation);
		setBboxToFit(null);                 //Nullstiller bboxToFit så kartet flytter seg til det nye stedet
	}, [activeLocation]);

	// Initialiserer søk med proximity fra SSOT
	const searchViewModel = useSearchViewModel(
		searchLocationUseCase, 
		onLocationChange, 
		{ lat: activeLocation.lat, lon: activeLocation.lon },
		onResetToDeviceLocation
	);

	const { apiKey, style } = useMemo(() => {
		return mapTilerRepository.getMapConfig();
	}, 
	[mapTilerRepository]);

	//Tidssonen kommer ferdig vasket fra activeLocation
	const tz = activeLocation.timezone;

	//Håndterer endringer i kartet (panorering/zooming)
	const onMapChange = useCallback((lat, lon, bbox, currentZoom) => {
		setBboxToFit(null); 

		setLocalLocation(prev => ({
			...prev,
			lat,
			lon
		}));

		setMapView({
			bbox,
			zoom: currentZoom
		});
	}, []);

	//Henting av værdata for kartutsnitt
	useEffect(() => {
		if (!mapView.bbox || !tz) {
			return;
		}

		let cancelled = false;
		const minDist = calculateWeatherIconSpread(mapView.zoom);

		const timer = setTimeout(async () => {

			setIsLoading(true);
			try {
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
		bboxToFit,
		location: localLocation,
		mapCenter: { lat: localLocation.lat, lon: localLocation.lon },
		weatherPoints,
		isLoading,
		onMapChange,

		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,


        onSuggestionSelected: (selected) => {
            onLocationChange(selected);
            searchViewModel.onSuggestionSelected(selected);
            const { zoom, bbox } = calculateMapView(selected); // Henter ferdig utregnet zoom og bbox fra helperen

            setBboxToFit(bbox);
            setMapView(prev => ({ 
                ...prev, 
                zoom: zoom 
            }));
        },

        onResetToDeviceLocation: () => {
            setBboxToFit(null);
            setMapView({ bbox: null, zoom: MAP_ZOOM_LEVELS.DEFAULT });
            setLocalLocation(activeLocation); 	//reset lokal kartposisjon
            onResetToDeviceLocation();  		//reset global SSOT
            searchViewModel.onResetLocation();
        }
    };
}