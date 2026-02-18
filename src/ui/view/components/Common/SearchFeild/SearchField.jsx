// src/ui/view/components/SearchField/SearchField.jsx
import { useState } from "react";

const LocationResetButton = ({ onClick }) => (
    <button 
        type="button"
        className="reset-location-btn"
        onClick={onClick}
        title="Bruk min posisjon"
    >
        <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
    </button>
);

export default function SearchField({ query, suggestions, onSearchChange, onSuggestionSelected, onResetToDeviceLocation }) {
    
	const [activeIndex, setActiveIndex] = useState(-1);

    const handleKeyDown = (event) => {
        if (!suggestions.length) {
            return;
        }

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
            default:
                break;
        }
    };

    return (
        <div className="search">
            <div className="search-input-container">
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
                
                {/* Kaller vi på resetknapp med funksjon */}
                <LocationResetButton onClick={onResetToDeviceLocation} />
            </div>

            {suggestions.length > 0 && (
                <ul id="search-suggestions" className="search-suggestions" role="listbox">
                    {suggestions.map((s, index) => (
                        <li
                            key={`${s.lat}-${s.lon}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            className={`search-suggestion ${index === activeIndex ? "active" : ""}`}
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