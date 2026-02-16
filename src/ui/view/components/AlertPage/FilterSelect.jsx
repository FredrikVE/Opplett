//src/ui/view/components/AlertPage/FilterSelect.jsx
import ChevronIcon from "../Common/Buttons/ChevronIcon.jsx";

export default function FilterSelect({ value, onChange, options, defaultLabel, totalCount }) {
    const finalLabel = totalCount !== undefined ? `${defaultLabel} (${totalCount})` : defaultLabel;

    return (
        <div className="alert-select-wrapper">
            <select className="alert-select-filter" value={value} onChange={onChange}>
                <option value="">{finalLabel}</option>
                {options.map((opt) => (
                    <option key={opt.id || opt.value} value={opt.id || opt.value}>
                        {opt.displayName || opt.label}
                    </option>
                ))}
            </select>
            <div className="select-chevron-overlay">
                <ChevronIcon isOpen={false} size={14} />
            </div>
        </div>
    );
}