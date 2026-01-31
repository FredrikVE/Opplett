// src/ui/viewmodel/SearchViewModel.js
import { useRef, useState } from "react";

export default function useSearchViewModel(geocodingRepository, onLocationSelected) {
    
    //Statevariabel og settmetode for søkemekanikk
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    //debounce for å unngå for mange api-kall når man søke b, be, ber, berg, bergen (osv)
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const onSearchChange = (text) => {
        setQuery(text);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (abortRef.current) {
            abortRef.current.abort(); // avbryt forrige kall
        }

        //Hvis teksten er kortere enn tre bokstaver forblir autocompletefeltet tomt
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }
        
        //Legg inn en liten debounce og abortcontroller
        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
        
            try {
                const results = await geocodingRepository.getSuggestions(text, controller.signal); //legger inn avbryt signal 
                setSuggestions(results);
            } 
            catch (error) {
                //Legg inn feilmelding for Abort som kan skje når man skriver fort
                if (error?.name !== "AbortError") {
                    console.warn("Søk feilet:", error);
                }
            }}, 

        350); // 350 ms debounce
    }
    
    const onSuggestionSelected = (suggestion) => {
        onLocationSelected({ 
            lat: suggestion.lat, 
            lon: suggestion.lon, 
            name: suggestion.name,
            timezone: suggestion.timezone 
        });

        setQuery(suggestion.name);
        setSuggestions([]);
    }
    
    return { query, suggestions, onSearchChange, onSuggestionSelected };
}
