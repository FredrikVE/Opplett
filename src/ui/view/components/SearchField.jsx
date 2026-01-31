import { useState } from "react";

export default function SearchField({ query, suggestions, onSearchChange, onSuggestionSelected }) {
    
    // useState for indeks til aktivt autocomplete-forslag.
    // -1 betyr at ingen forslag er valgt.
    // Brukes for navigasjon med piltaster (ArrowUp / ArrowDown)
    // og valg med Enter.
    const [activeIndex, setActiveIndex] = useState(-1);

    //arrow funksjon for å håndtere keyboard trykk.
    const handleKeyDown = (event) => {
        if (!suggestions.length) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setActiveIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;

            case "ArrowUp":
                event.preventDefault();
                setActiveIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;

            case "Enter":
                event.preventDefault();
                if (activeIndex >= 0) {
                    onSuggestionSelected(suggestions[activeIndex]);
                    setActiveIndex(-1);
                }
                break;

            case "Escape":
                setActiveIndex(-1);
                break;
        }
    }

    return (
        <div className="search">
           
            <input
                id="location-search"
                className="search-input"
                type="text"
                placeholder="Søk sted, by eller adresse…"
                
                value={query}

                onChange={(event) => {
                    onSearchChange(event.target.value);
                    setActiveIndex(-1);
                }}

                onKeyDown={handleKeyDown}
                autoComplete="off"
            />

            {suggestions.length > 0 && (
                <ul
                    id="search-suggestions"
                    className="search-suggestions"
                    role="listbox"
                >
                    {suggestions.map((s, index) => (
                        <li
                            key={`${s.lat}-${s.lon}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            
                            className={`search-suggestion ${
                                index === activeIndex ? "active" : ""
                            }`}
                            
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseDown={() => onSuggestionSelected(s)}
                        >
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
