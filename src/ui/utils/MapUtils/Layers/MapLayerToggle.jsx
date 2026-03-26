//src/ui/utils/MapUtils/Layers/MapLayerToggle.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { WEATHER_LAYERS, LAYER_KEYS } from "../../../../utils/MapUtils/Layers/WeatherLayerConfig.js";

export default function MapLayerToggle({ activeLayer, onLayerChange, showMarkers, onToggleMarkers }) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	/* =========================
		AKTIV LAYER INFO
	========================= */
	const activeConfig = WEATHER_LAYERS.find(l => l.key === activeLayer)
		|| WEATHER_LAYERS[0];

	const hasActiveOverlay = activeLayer !== LAYER_KEYS.NONE;

	/* =========================
		HANDLERS
	========================= */
	const toggleDropdown = useCallback(() => {
		setIsOpen(prev => !prev);
	}, []);

	const selectLayer = useCallback((key) => {
		onLayerChange(key);
		setIsOpen(false);
	}, [onLayerChange]);

	/* =========================
		LUKK VED KLIKK UTENFOR
	========================= */
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	/* =========================
		RENDER
	========================= */
	return (
		<div className="map-layer-toggle" ref={dropdownRef}>
			{/* Dropdown-meny (åpnes oppover) */}
			{isOpen && (
				<div className="map-layer-dropdown">
					<div className="map-layer-dropdown-header">Kartlag</div>

					{WEATHER_LAYERS.map((layer) => (
						<button
							key={layer.key}
							className={`map-layer-option ${activeLayer === layer.key ? "active" : ""}`}
							onClick={() => selectLayer(layer.key)}
						>
							<span className="map-layer-option-icon">{layer.icon}</span>
							<span className="map-layer-option-label">{layer.label}</span>
							{activeLayer === layer.key && (
								<span className="map-layer-option-check">✓</span>
							)}
						</button>
					))}

					{/* Valgfri markør-toggle — kun synlig når et overlay er aktivt */}
					{hasActiveOverlay && (
						<>
							<div className="map-layer-divider" />
							<button
								className="map-layer-option"
								onClick={onToggleMarkers}
							>
								<span className="map-layer-option-icon">
									{showMarkers ? "☀️" : "☀️"}
								</span>
								<span className="map-layer-option-label">
									Vis værmarkører
								</span>
								<span className="map-layer-option-check">
									{showMarkers ? "✓" : ""}
								</span>
							</button>
						</>
					)}
				</div>
			)}

			{/* Hovedknapp */}
			<button
				className={`map-layer-button ${hasActiveOverlay ? "has-overlay" : ""}`}
				onClick={toggleDropdown}
				aria-label="Velg kartlag"
				aria-expanded={isOpen}
			>
				<svg className="map-layer-button-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
				<span className="map-layer-button-label">
					{hasActiveOverlay ? activeConfig.label : "Kartlag"}
				</span>
				<svg className={`map-layer-chevron ${isOpen ? "open" : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
		</div>
	);
}