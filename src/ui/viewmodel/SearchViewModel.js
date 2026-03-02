// src/ui/viewmodel/SearchViewModel.js
import { useRef, useState } from "react";

export default function useSearchViewModel(searchLocationUseCase, onLocationSelected, currentLocation) {
    const SEARCH_DEBOUNCE_DELAY_MS = 350;

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const requestIdRef = useRef(0);

    const onSearchChange = (text) => {
        setQuery(text);

        if (text.length < 3) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();

            const controller = new AbortController();
            abortRef.current = controller;
            const requestId = ++requestIdRef.current;

            try {
                // HER SKJER MAGIEN: Vi sender med currentLocation ({lat, lon})
                const results = await searchLocationUseCase.getSuggestions(
                    text, 
                    controller.signal, 
                    currentLocation 
                );

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

    // ... resten av metodene (onSuggestionSelected, onResetLocation) forblir helt like
    const onSuggestionSelected = (suggestion) => {
        onLocationSelected(suggestion);
        setQuery(suggestion.name);
        setSuggestions([]);
    };

    const onResetLocation = (lat, lon) => {
        setQuery("");
        setSuggestions([]);
        onLocationSelected({ lat, lon, name: null, timezone: null, bounds: null, type: null });
    };

    return {
        query,
        suggestions,
        onSearchChange,
        onSuggestionSelected,
        onResetLocation,
    };
}