// src/ui/viewmodel/SearchViewModel.js
import { useRef, useState } from "react";

export default function useSearchViewModel(geocodingRepository, onLocationSelected) {
    const SEARCH_DEBOUNCE_DELAY_MS = 350;

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const requestIdRef = useRef(0);

    const onSearchChange = (text) => {
        setQuery(text);

        if (text.length < 3) {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            if (abortRef.current) {
                abortRef.current.abort();
            }

            setSuggestions([]);
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            if (abortRef.current) {
				abortRef.current.abort();
			}

            const controller = new AbortController();
            abortRef.current = controller;
            const requestId = ++requestIdRef.current;

            try {
                const results = await geocodingRepository.getSuggestions(text, controller.signal);
                if (requestId === requestIdRef.current) {
                    setSuggestions(results);
                }
            } 

			catch (error) {
                if (error?.name !== "AbortError") {
					console.warn("Søk feilet:", error);
				}
            } 

			finally {
                if (requestId === requestIdRef.current) {
					abortRef.current = null;
				}
            }
        }, SEARCH_DEBOUNCE_DELAY_MS);
    };

    const onSuggestionSelected = (suggestion) => {
        onLocationSelected({
            lat: suggestion.lat,
            lon: suggestion.lon,
            name: suggestion.name,
            timezone: suggestion.timezone,
        });
        setQuery(suggestion.name);
        setSuggestions([]);
    };

    //OPPDATERT FUNKSJON
    const onResetLocation = (lat, lon) => {
        setQuery(""); 
        setSuggestions([]);
        
        // Vi setter name til null. 
        // Dette trigger useEffect i HomeScreenViewModel til å hente navnet på nytt via reverse geocoding.
        onLocationSelected({
            lat: lat,
            lon: lon,
            name: null, 
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    };

    return {
        query,
        suggestions,
        onSearchChange,
        onSuggestionSelected,
        onResetLocation,
    };
}