//src/ui/utils/MapUtils/WeatherMarkers.js
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../../view/components/MapPage/WeatherSymbolLabel.jsx"

export function renderWeatherMarkers({ map, markersRef, weatherPoints, onLocationClick }) {

	markersRef.current.forEach(m => m.remove());
	markersRef.current = [];

	if (!weatherPoints?.length) return;

	weatherPoints.forEach(point => {

		const container = document.createElement("div");
		container.className = "map-marker-wrapper";

		container.onclick = e => {
			e.stopPropagation();
			if (onLocationClick) onLocationClick(point);
		};

		const root = createRoot(container);

		root.render(<WeatherSymbolLabel point={point}/>);

		const marker = new maptilersdk.Marker({ element: container })
			.setLngLat([point.lon, point.lat])
			.addTo(map);

		markersRef.current.push(marker);
	});
}