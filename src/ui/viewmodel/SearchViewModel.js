// src/ui/viewmodel/SearchViewModel.js
import { useRef, useState } from "react";

export default function useSearchViewModel(searchLocationUseCase, onLocationSelected, currentLocation, onReset) {
    const SEARCH_DEBOUNCE_DELAY_MS = 350;
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const requestIdRef = useRef(0);


    //Håndterer tekstendring i søkefeltet med debounce og avbrytingsstøtte (AbortController).
    const onSearchChange = (text) => {
        setQuery(text);

        // Vi krever minst 3 tegn før vi starter API-kall
        if (text.length < 3) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            // Avbryter eventuelle pågående forespørsler
            if (abortRef.current) {
                abortRef.current.abort();
            }

            const controller = new AbortController();
            abortRef.current = controller;
            const requestId = ++requestIdRef.current;

            try {
                // Sender med currentLocation for å prioritere treff i nærheten av brukeren
                const results = await searchLocationUseCase.getSuggestions(
                    text, 
                    controller.signal, 
                    currentLocation 
                );

                // Sjekker requestId for å unngå "out of order" oppdateringer hvis flere kall er aktive
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


    //Kalles når brukeren klikker på et forslag i listen eller trykker Enter.
    const onSuggestionSelected = (suggestion) => {
        onLocationSelected(suggestion); // Oppdaterer SSOT i App.jsx
        
        //Tømmer søkefeltet i stedet for å sette navnet inn i det
        setQuery("");      
        
        setSuggestions([]);             // Skjuler forslagslisten
    };

    //Nullstiller søket og kaller den globale reset-funksjonen.
    const onResetLocation = () => {
        setQuery("");                   // Tømmer tekstfeltet
        setSuggestions([]);             // Skjuler forslagslisten
        
        if (onReset) {
            onReset(); // Tømmer manualLocation i App.jsx slik at GPS tar over
        }
    };

    return {
        query,
        suggestions,
        onSearchChange,
        onSuggestionSelected,
        onResetLocation,
    };
}