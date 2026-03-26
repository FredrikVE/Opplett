//src/ui/view/components/MapPage/MapLayerToggle/MapLayerButton.jsx
import ChevronIcon from "../../Common/Buttons/ChevronIcon.jsx";

export default function MapLayerButton({ isOpen, onClick, label, hasActiveOverlay }) {
	return (
		<button
			className={`map-layer-button ${hasActiveOverlay ? "has-overlay" : ""}`}
			onClick={onClick}
			aria-label="Velg kartlag"
			aria-expanded={isOpen}
		>
			<svg
				className="map-layer-button-icon"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M12 2L2 7l10 5 10-5-10-5z" />
				<path d="M2 17l10 5 10-5" />
				<path d="M2 12l10 5 10-5" />
			</svg>

			<span className="map-layer-button-label">{label}</span>

			<ChevronIcon isOpen={isOpen} className="map-layer-chevron" size={14} />
		</button>
	);
}