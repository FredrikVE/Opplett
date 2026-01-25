// src/ui/view/components/SearchField.jsx
export default function SearchField({ query, suggestions, onSearchChange, onSuggestionSelected }) {
    return (
        <div className="search">
            <label className="visually-hidden">
                Søk etter sted, by eller adresse
            </label>

            <input
                id="location-search"
                className="search-input"
                type="text"
                placeholder="Søk sted, by eller adresse…"
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}

            />

            {suggestions.length > 0 && (
                <ul
                    id="search-suggestions"
                    className="search-suggestions"
                >
                    {suggestions.map((s) => (
                        <li
                            key={`${s.lat}-${s.lon}`}
                            className="search-suggestion"
                            onClick={() => onSuggestionSelected(s)}
                        >
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
