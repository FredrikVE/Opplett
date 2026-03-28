// src/ui/view/components/MapPage/MapLayerToggle/MapMarkerToggle.jsx
//import CheckIcon from "../../Common/Icons/CheckIcon.jsx";
import CheckIcon from "../../Common/Icons/CheckIcon.jsx";
import WeatherMarkerIcon from "../../Common/Icons/WeatherMarkerIcon.jsx";

export default function MapMarkerToggle({ showMarkers, onClick }) {
	return (
		<button className="map-layer-option" onClick={onClick}>
			<span className="map-layer-option-icon">
				<WeatherMarkerIcon size={16} />
			</span>
			<span className="map-layer-option-label">Vis værmarkører</span>
			<span className="map-layer-option-check">
				{showMarkers && <CheckIcon size={14} />}
			</span>
		</button>
	);
}