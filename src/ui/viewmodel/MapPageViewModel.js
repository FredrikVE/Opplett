import { useEffect, useState, useMemo } from "react";
import useSearchViewModel from "./SearchViewModel.js";
import { resolveTimezone } from "../utils/TimeZoneUtils/timeFormatters.js";

// Vi legger til getWeatherForecastUseCase som parameter
export default function useMapPageViewModel(getMapConfigUseCase, searchLocationUseCase, getLocationNameUseCase, getWeatherForecastUseCase, initialLat, initialLon) {

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
    
    // NYTT: State for værdata
    const [currentWeather, setCurrentWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    if (initialLat !== prevInitial.lat || initialLon !== prevInitial.lon) {
        setPrevInitial({ lat: initialLat, lon: initialLon });
        setLocation(prev => ({
            ...prev,
            lat: initialLat ?? baseConfig.defaultCenter.lat,
            lon: initialLon ?? baseConfig.defaultCenter.lon
        }));
    }

    const searchViewModel = useSearchViewModel(
        searchLocationUseCase,
        setLocation
    );

    const tz = useMemo(
        () => resolveTimezone(location.timezone),
        [location.timezone]
    );

    //Effekt for Reverse Geocoding (Stedsnavn)
    useEffect(() => {
        if (!location.lat || !location.lon) return;
        let cancelled = false;

        async function loadLocationName() {
            try {
                const result = await getLocationNameUseCase.execute({
                    lat: location.lat,
                    lon: location.lon
                });
                if (cancelled || !result?.name) return;

                setLocation(prev => {
                    if (prev.name === result.name && prev.timezone === result.timezone) return prev;
                    return { ...prev, name: result.name, timezone: result.timezone };
                });
            } catch (error) {
                console.warn("Kunne ikke hente stedsnavn (MapPage)", error);
            }
        }

        loadLocationName();
        return () => { cancelled = true; };
    }, 
	[location.lat, location.lon, getLocationNameUseCase]);


    // 2. NY EFFEKT: Hente værdata for kartet
    useEffect(() => {
        if (!location.lat || !location.lon) {
			return;
		}

        let cancelled = false;

        async function fetchWeather() {
            setLoadingWeather(true);
            try {
                const forecastData = await getWeatherForecastUseCase.execute({
                    lat: location.lat,
                    lon: location.lon
                });

                if (cancelled) {
					return;
				}

                // Vi henter "currentWeather" fra forecast-resultatet
                // Antar her at Use Case returnerer et objekt med currentWeather-egenskap
                if (forecastData) {
					setCurrentWeather(forecastData);
				}
            }

			catch (error) {
                console.error("Kunne ikke hente vær til kart:", error);
            }
			
			finally {
                if (!cancelled) {
					setLoadingWeather(false);
				}
            }
        }

        fetchWeather();
        return () => { 
			cancelled = true; 
		};

    }, 
	[location.lat, location.lon, getWeatherForecastUseCase]);


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

        // Lokasjon & Vær (Nye variabler her)
        location,
        mapCenter,
        currentWeather, 
        loadingWeather,
        timezone: tz,

        // Søk
        query: searchViewModel.query,
        suggestions: searchViewModel.suggestions,
        onSearchChange: searchViewModel.onSearchChange,
        onSuggestionSelected: searchViewModel.onSuggestionSelected,
        onResetToDeviceLocation: () => searchViewModel.onResetLocation(initialLat, initialLon)
    };
}