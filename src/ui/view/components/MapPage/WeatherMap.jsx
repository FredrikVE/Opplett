import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { getWeatherIconFileName } from "../../../utils/CommonUtils/weatherIcons.js";

export default function WeatherMap({
	apiKey,
	style,
	lat,
	lon,
	zoom,
	weatherPoints,
	onMapChange
}) {
	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const markersRef = useRef([]); // Holder styr på aktive markører så vi kan fjerne dem

	// 1. Initialiser kartet
	useEffect(() => {
		if (!mapContainerRef.current || !apiKey || mapRef.current) return;

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style: style,
			center: [Number(lon), Number(lat)],
			zoom: Number(zoom) || 6,
			attributionControl: false
		});

		// Når brukeren er ferdig med å flytte kartet, sender vi info opp til ViewModel
		map.on("moveend", () => {
			const newCenter = map.getCenter();
			const bounds = map.getBounds();
			const currentZoom = map.getZoom();

			const bbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			// Vi sender med zoom også, så UseCase kan regne ut minDist!
			onMapChange?.(newCenter.lat, newCenter.lng, bbox, currentZoom);
		});

		mapRef.current = map;

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, [apiKey, style]); // Kun ved oppstart

	// 2. Oppdater markører når weatherPoints endres
	useEffect(() => {
		const map = mapRef.current;
		if (!map || !weatherPoints) return;

		// Rydd opp gamle markører før vi tegner nye
		markersRef.current.forEach(m => m.remove());
		markersRef.current = [];

		weatherPoints.forEach(point => {
			// Lag HTML-elementet for markøren
			const el = document.createElement("div");
			el.className = "map-weather-marker";

			const iconFile = getWeatherIconFileName(point.weatherSymbol);

			el.innerHTML = `
				<div class="marker-container">
					<img src="/weather_icons/100/${iconFile}" alt="vær" class="marker-icon" />
					<div class="marker-details">
						<span class="marker-temp">${Math.round(point.temp)}°</span>
						<span class="marker-name">${point.name}</span>
					</div>
				</div>
			`;

			// Legg til markøren på kartet
			const marker = new maptilersdk.Marker({ element: el })
				.setLngLat([Number(point.lon), Number(point.lat)])
				.addTo(map);

			markersRef.current.push(marker);
		});
	}, [weatherPoints]);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}