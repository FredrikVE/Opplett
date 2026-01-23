// src/ui/viewmodel/SearchViewModel.js
import { useState } from "react";

export default function useSearchViewModel(geocodingRepository, onLocationSelected) {

    // Statevariabeler for søk
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    async function onSearchChange(text) {
        setQuery(text);

        //Hvis teksten er kortere enn tre bokstaver forblir autocompletefeltet tomt
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        //Når mer enn tre bokstaver er skrevet inn, så hentes søkeforslag fra autocomplete
        const results = await geocodingRepository.getSuggestions(text);
        setSuggestions(results);
    }

    //Funksjon som setter koordinatene fra autocomplete forslag
    function onSuggestionSelected(suggestion) {
        onLocationSelected({
            lat: suggestion.lat,
            lon: suggestion.lon,
            name: suggestion.name
        });

        setQuery(suggestion.name);
        setSuggestions([]);
    }

    return { query, suggestions, onSearchChange, onSuggestionSelected };
}
