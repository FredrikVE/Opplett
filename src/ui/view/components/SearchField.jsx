//src/ui/view/components/SearchField.jsx
export default function SearchField({ query, suggestions, onSearchChange, onSuggestionSelected }) {
    return (
        <div className="search">
            <input
                type="text"
                placeholder="Søk sted, by eller adresse…"
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
            />

            {suggestions.length > 0 && (
                <ul className="search-suggestions">
                    {suggestions.map((s) => (
                        <li
                            key={`${s.lat}-${s.lon}`}
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
