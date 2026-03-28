//src/ui/view/components/MapPage/MapLayerToggle/MapLayerButton.jsx
import ChevronIcon from "../../Common/Buttons/ChevronIcon.jsx";
import LayerIcon from "../../Common/Icons/LayerIcon.jsx";

export default function MapLayerButton({ isOpen, onClick, label, hasActiveOverlay }) {
	return (
		<button
			className={`map-layer-button ${hasActiveOverlay ? "has-overlay" : ""}`}
			onClick={onClick}
			aria-label="Velg kartlag"
			aria-expanded={isOpen}
		>
			<LayerIcon size={18} />

			<span className="map-layer-button-label">{label}</span>

			<ChevronIcon isOpen={isOpen} className="map-layer-chevron" size={14} />
		</button>
	);
}