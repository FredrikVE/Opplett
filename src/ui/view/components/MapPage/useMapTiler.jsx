// src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler({ apiKey, style, lat, lon, zoom, weatherPoints, onMapChange }) {

	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef([]);

	//Init kart
	useEffect(() => {

		if (!mapContainerRef.current || mapInstanceRef.current) {
			return;
		}

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style: style,
			center: [Number(lon), Number(lat)],
			zoom: Number(zoom),
			attributionControl: false
		});

		map.on("moveend", () => {

			const center = map.getCenter();
			const bounds = map.getBounds();

			const bbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			onMapChange(center.lat, center.lng, bbox, map.getZoom());
		});

		mapInstanceRef.current = map;

		return () => {
			map.remove();
			mapInstanceRef.current = null;
		};

	}, []); //tom dependency array siden dette skal laste kartet én gang ved init



	//Programmatisk flytting
	useEffect(() => {
		const map = mapInstanceRef.current;

		if (!map || lat == null || lon == null) {
			return;
		}

		map.jumpTo({
			center: [lon, lat],
			zoom: zoom
		});

	}, [lat, lon, zoom]);



	//Render vær-symboler
	useEffect(() => {

		const map = mapInstanceRef.current;
		if (!map) {
			return;
		}

		//Fjern gamle værikoner
		markersRef.current.forEach(marker => 
			marker.remove()
		);

		markersRef.current = [];

		//Lag nye værikoner
		markersRef.current = weatherPoints.map(point => {

			const container = document.createElement("div");

			const root = createRoot(container);
			root.render(<WeatherSymbolLabel point={point} />);

			return new maptilersdk.Marker({ element: container })
				.setLngLat([point.lon, point.lat])
				.addTo(map);
		});

	}, [weatherPoints]);


	return mapContainerRef;
}