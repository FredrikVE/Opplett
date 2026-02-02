// src/ui/viewmodel/SearchViewModel.js
import { useRef, useState } from "react";

export default function useSearchViewModel(geocodingRepository, onLocationSelected) {
	
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);

	const debounceRef = useRef(null);
	const abortRef = useRef(null);
	const requestIdRef = useRef(0);

	const onSearchChange = (text) => {
		setQuery(text);

		// Nullstill aktiv liste hvis for kort
		if (text.length < 3) {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
				debounceRef.current = null;
			}

			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}

			setSuggestions([]);
			return;
		}

		// Debounce
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(async () => {
			// Avbryt evt. forrige request
			if (abortRef.current) {
				abortRef.current.abort();
			}

			const controller = new AbortController();
			abortRef.current = controller;

			const requestId = ++requestIdRef.current;

			try {
				const results = await geocodingRepository.getSuggestions(text, controller.signal);

				// Kun siste request får oppdatere state
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
				// Rydd hvis dette er siste request
				if (requestId === requestIdRef.current) {
					abortRef.current = null;
				}
			}
		}, 350);
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

	return {
		query,
		suggestions,
		onSearchChange,
		onSuggestionSelected,
	};
}
