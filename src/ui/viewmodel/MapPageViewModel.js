// src/ui/viewmodel/MapPageViewModel.js
import { useEffect, useState, useMemo } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

export default function useMapPageViewModel(getMapConfigUseCase, searchLocationUseCase, getLocationNameUseCase, initialLat, initialLon) {

	//Statevariabler og config
	const baseConfig = useMemo(() =>
		getMapConfigUseCase.execute(),
		[getMapConfigUseCase]
	);

	const initialLocation = {
		lat: initialLat ?? baseConfig.defaultCenter.lat,
		lon: initialLon ?? baseConfig.defaultCenter.lon,
		name: null,
		timezone: null
	};

	const [location, setLocation] = useState(initialLocation);
	const [prevInitial, setPrevInitial] = useState({lat: initialLat, lon: initialLon});


	//UseEffekt som oppdaterer GPS-koordinater
	if (initialLat !== prevInitial.lat || initialLon !== prevInitial.lon) {
		setPrevInitial({ lat: initialLat, lon: initialLon });
		setLocation(prev => ({
			...prev,
			lat: initialLat ?? baseConfig.defaultCenter.lat,
			lon: initialLon ?? baseConfig.defaultCenter.lon
		}));
	}

	//SearchViewModel
	const searchViewModel = useSearchViewModel(
		searchLocationUseCase,
		setLocation
	);


	//SSOT for tidssone
	const tz = useMemo(
		() => resolveTimezone(location.timezone),
		[location.timezone]
	);

	//UseEffect for reverse geocoding
	useEffect(() => {

		if (!location.lat || !location.lon) {
			return;
		}

		let cancelled = false;

		async function loadLocationName() {
			try {
				const result = await getLocationNameUseCase.execute({
					lat: location.lat,
					lon: location.lon
				});

				if (cancelled || !result?.name) {
					return;
				}

				setLocation(prev => {
					if (
						prev.name === result.name &&
						prev.timezone === result.timezone
					) {
						return prev;
					}

					return {
						...prev,
						name: result.name,
						timezone: result.timezone
					};
				});
			}
			catch (error) {
				console.warn("Kunne ikke hente stedsnavn (MapPage)", error);
			}
		}

		loadLocationName();

		//Clean-up-funksjon
		return () => {
			cancelled = true;
		};
	},
	[location.lat, location.lon, getLocationNameUseCase]);


	// Map center (lik struktur som Forecast)
	const mapCenter = useMemo(() => ({
			lat: location.lat ?? baseConfig.defaultCenter.lat,
			lon: location.lon ?? baseConfig.defaultCenter.lon
		}),
		[location.lat, location.lon, baseConfig.defaultCenter.lat, baseConfig.defaultCenter.lon]
	);


	return {

		// Kart-config
		apiKey: baseConfig.apiKey,
		style: baseConfig.style,
		zoom: baseConfig.defaultZoom,

		// Lokasjon
		location,
		mapCenter,
		timezone: tz,

		// Søk
		query: searchViewModel.query,
		suggestions: searchViewModel.suggestions,
		onSearchChange: searchViewModel.onSearchChange,
		onSuggestionSelected: searchViewModel.onSuggestionSelected,
		onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
	};
}