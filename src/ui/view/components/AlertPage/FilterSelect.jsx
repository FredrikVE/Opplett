import { useState } from "react";
import ChevronIcon from "../Common/Buttons/ChevronIcon.jsx";
import CheckBoxItem from "./CheckBoxItem.jsx";


export default function FilterSelect({ value, onChange, options, defaultLabel, getCountForOption }) {
    const [isOpen, setIsOpen] = useState(false);

    //Handler funksjoner
    const handleOptionClick = (optionValue) => {
        let newValue;

        if (value.includes(optionValue)) {
            newValue = value.filter((v) => v !== optionValue);	//Fjerner verdien hvis den allerede finnes
        } 
		
		else {												//Ellers Legger vi til verdien
            newValue = [...value, optionValue];
        }

        onChange(newValue);
	}

    const handleClearAll = () => {
        onChange([]);
    }

    const handleToggleDropdown = () => {
        setIsOpen(!isOpen);
    }

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {		//Lukker bare hvis fokus flyttes helt ut av komponenten
            setIsOpen(false);
        }
    }

    //Hjelpefunksjoner
    function getOptionData(option) {
        return {
            id: option.id || option.value,
            label: option.displayName || option.label
        };
    }

    function getDisplayLabel() {
        if (value.length === 0) {
            return defaultLabel;
        }
        return `${value.length} valgt`;
    }

    return (
        <div className="custom-select-wrapper" tabIndex={0} onBlur={handleBlur}>
            <button className="custom-select-trigger" onClick={handleToggleDropdown}>
                <span>{getDisplayLabel()}</span>
                <ChevronIcon isOpen={isOpen} size={14} />
            </button>

            {isOpen && (
                <div className="custom-select-dropdown">

                    {/* Standardvalget (tøm filter) */}
                    <CheckBoxItem
                        label={defaultLabel} 
                        isChecked={value.length === 0} 
                        onClick={handleClearAll} 
                    />

                    {/* Mapper over opsjoner med eksplisitt logikk */}
                    {options.map((option) => {
                        const { id, label } = getOptionData(option);
                        const isChecked = value.includes(id);
                        const count = getCountForOption ? getCountForOption(id) : 0;

                        return (
                            <CheckBoxItem
                                key={id}
                                label={label}
                                isChecked={isChecked}
                                hasAlerts={count > 0}
                                onClick={() => handleOptionClick(id)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}