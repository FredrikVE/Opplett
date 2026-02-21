import { useState } from "react";
import ChevronIcon from "../Common/Buttons/ChevronIcon.jsx";
import "../../../style/FilterDropDown.css";

export default function FilterSelect({ value, onChange, options, defaultLabel, getCountForOption }) {
    const [isOpen, setIsOpen] = useState(false);

    function isValueSelected(optionValue) {
        let selected = false;

        for (let i = 0; i < value.length; i++) {
            if (value[i] === optionValue) {
                selected = true;
            }
        }

        return selected;
    }

    function buildNewValue(optionValue) {
        let newValue = [];
        let alreadySelected = isValueSelected(optionValue);

        if (alreadySelected === true) {
            for (let i = 0; i < value.length; i++) {
                if (value[i] !== optionValue) {
                    newValue[newValue.length] = value[i];
                }
            }
        } else {
            for (let i = 0; i < value.length; i++) {
                newValue[newValue.length] = value[i];
            }

            newValue[newValue.length] = optionValue;
        }

        return newValue;
    }

    function toggleOption(optionValue) {
        const newValue = buildNewValue(optionValue);
        onChange(newValue);
    }

    function clearAll() {
        onChange([]);
    }

    function getOptionValue(option) {
        if (option.id) {
            return option.id;
        }

        return option.value;
    }

    function getOptionLabel(option) {
        if (option.displayName) {
            return option.displayName;
        }

        return option.label;
    }

    function getDisplayLabel() {
        const selectedCount = value.length;

        if (selectedCount === 0) {
            return defaultLabel;
        }

        return selectedCount + " valgt";
    }

    function handleToggleOpen() {
        if (isOpen === true) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }

    function handleBlur(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    }

    function buildOptionElements() {
        const elements = [];

        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const optionValue = getOptionValue(option);
            const label = getOptionLabel(option);
            const checked = isValueSelected(optionValue);

            let hasAlerts = false;

            if (getCountForOption) {
                const count = getCountForOption(optionValue);

                if (count > 0) {
                    hasAlerts = true;
                }
            }

            let spanClass = "";

            if (hasAlerts === true) {
                spanClass = "has-alerts";
            }

            elements[elements.length] = (
                <div
                    key={optionValue}
                    className="custom-option"
                    onClick={() => toggleOption(optionValue)}
                >
                    <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                    />
                    <span className={spanClass}>{label}</span>
                </div>
            );
        }

        return elements;
    }

    let dropdownContent = null;

    if (isOpen === true) {
        dropdownContent = (
            <div className="custom-select-dropdown">
                <div className="custom-option" onClick={clearAll}>
                    <input
                        type="checkbox"
                        checked={value.length === 0}
                        readOnly
                    />
                    <span>{defaultLabel}</span>
                </div>
                {buildOptionElements()}
            </div>
        );
    }

    return (
        <div
            className="custom-select-wrapper"
            tabIndex={0}
            onBlur={handleBlur}
        >
            <button
                className="custom-select-trigger"
                onClick={handleToggleOpen}
            >
                <span>{getDisplayLabel()}</span>
                <ChevronIcon isOpen={isOpen} size={14} />
            </button>

            {dropdownContent}
        </div>
    );
}