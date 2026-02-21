import { useState, useRef, useEffect } from "react";
import ChevronIcon from "../Common/Buttons/ChevronIcon.jsx";
import "../../../style/FilterDropDown.css";

export default function FilterSelect({ value, onChange, options, defaultLabel }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (optionValue) => {
        let newValue;

        if (value.includes(optionValue)) {
            newValue = value.filter((v) => v !== optionValue);
        } 
		
		else {
            newValue = [...value, optionValue];
        }

        onChange(newValue);
    };

    const clearAll = () => {
        onChange([]);
    };

    const selectedCount = value.length;

    const displayLabel =
        selectedCount === 0
            ? defaultLabel
            : `${selectedCount} valgt`;

    return (
        <div className="custom-select-wrapper" ref={wrapperRef}>
            <button
                className="custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{displayLabel}</span>
                <ChevronIcon isOpen={isOpen} size={14} />
            </button>

            {isOpen && (
                <div className="custom-select-dropdown">

                    {/* "Alle" valg */}
                    <div
                        className="custom-option"
                        onClick={clearAll}
                    >
                        <input
                            type="checkbox"
                            checked={selectedCount === 0}
                            readOnly
                        />
                        <span>{defaultLabel}</span>
                    </div>

                    {options.map((opt) => {
                        const optionValue = opt.id || opt.value;
                        const label = opt.displayName || opt.label;

                        return (
                            <div
                                key={optionValue}
                                className="custom-option"
                                onClick={() => toggleOption(optionValue)}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(optionValue)}
                                    readOnly
                                />
                                <span>{label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}