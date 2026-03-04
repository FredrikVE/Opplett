import { useEffect, useState, useMemo, useCallback } from "react";
import useSearchViewModel from "./SearchViewModel.js";

function calculateMinDist(zoom) {
	if (zoom <= 3) return 2.5;
	if (zoom <= 5) return 1.2;
	if (zoom <= 7) return 0.5;
	if (zoom <= 9) return 0.15;
	if (zoom <= 11) return 0.04;
	if (zoom <= 13) return 0.01;
	return 0.001;
}

export default function useMapPageViewModel( mapTilerRepository, searchLocationUseCase, getMapWeatherUseCase, activeLocation, onLocationChange, onResetToDeviceLocation) {
    const DEFAULT_ZOOM = 12;      // Standard zoom for byer/tettsteder
    const COUNTRY_ZOOM = 3;    // Oversiktszoom for land
    const DEBOUNCE_DELAY_MS = 500;

	const [mapView, setMapView] = useState({ bbox: null, zoom: DEFAULT_ZOOM });
	const [bboxToFit, setBboxToFit] = useState(null);
	
	//Vi holder på en lokal kopi av lokasjonen for å støtte umiddelbar feedback ved panorering,
	//men vi synkroniserer den med activeLocation når den endres eksternt.
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
		const minDist = calculateMinDist(mapView.zoom);

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
            
            if (selected.type === "country") {
                // For land: Zoom ut til nivå 3
                setBboxToFit(null);
                setMapView(prev => ({ 
                    ...prev, 
                    zoom: COUNTRY_ZOOM
                }));
            } 

            else if (selected.bounds) {
                // For byer/regioner med definert grense: Bruk bboxToFit.
                // Kartet vil automatisk zoome inn (max 12 pga fitBounds-innstilling i useMapTiler)
                const bbox = [
                    selected.bounds.southwest.lng,
                    selected.bounds.southwest.lat,
                    selected.bounds.northeast.lng,
                    selected.bounds.northeast.lat
                ];
                setBboxToFit(bbox);
                // Vi setter også zoom i state for å være konsistente
                setMapView(prev => ({ ...prev, zoom: DEFAULT_ZOOM }));
            } 

            else {
                // For spesifikke punkt/steder uten bounds: 
                // Tving zoom tilbake til 12 for å unngå at vi blir hengende i "land-zoom"
                setBboxToFit(null);
                setMapView(prev => ({ 
                    ...prev, 
                    zoom: DEFAULT_ZOOM 
                }));
            }
        },

		onResetToDeviceLocation: () => {
			setBboxToFit(null);
			setMapView({ bbox: null, zoom: DEFAULT_ZOOM });
			setLocalLocation(activeLocation);     // reset lokal kartposisjon
			onResetToDeviceLocation();			  // reset global SSOT
			searchViewModel.onResetLocation();
		}
	};
}