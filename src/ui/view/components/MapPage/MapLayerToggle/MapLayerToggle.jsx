//src/ui/view/components/MapPage/MapLayerToggle/MapLayerToggle.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import MapLayerButton from "./MapLayerButton.jsx";
import MapLayerDropdown from "./MapLayerDropdown.jsx";
import { WEATHER_LAYERS, LAYER_KEYS } from "./MapToggleConfig.js";

export default function MapLayerToggle({ activeLayer, onLayerChange, onOpenChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	const activeConfig =
		WEATHER_LAYERS.find(l => l.key === activeLayer) ||
		WEATHER_LAYERS[0];

	const hasActiveOverlay = activeLayer !== LAYER_KEYS.NONE;

	useEffect(() => {
		onOpenChange?.(isOpen);
	}, 
	[isOpen, onOpenChange]);

	const toggleDropdown = useCallback(() => {
		setIsOpen(prev => !prev);
	}, 
	[]);

	const selectLayer = useCallback((key) => {
		const nextLayer = key === activeLayer ? LAYER_KEYS.NONE : key;
		onLayerChange(nextLayer);
		setIsOpen(false);
	}, [onLayerChange, activeLayer]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	},
	[isOpen]);

	return (
		<div className="map-layer-toggle" ref={dropdownRef}>
			{isOpen && (
				<MapLayerDropdown
					layers={WEATHER_LAYERS}
					activeLayer={activeLayer}
					onSelect={selectLayer}
				/>
			)}

			<MapLayerButton
				isOpen={isOpen}
				onClick={toggleDropdown}
				label={hasActiveOverlay ? activeConfig.label : "Kartlag"}
				hasActiveOverlay={hasActiveOverlay}
			/>
		</div>
	);
}