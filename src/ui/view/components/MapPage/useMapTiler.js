// src/ui/view/components/MapPage/useMapTiler.js
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { getWeatherIconFileName } from "../../../utils/CommonUtils/weatherIcons.js";

export function useMapTiler({ apiKey, style, lat, lon, zoom, weatherPoints, onMapChange }) {

	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef([]);

	//Initialiserer selve kartet i oppstarten
	useEffect(() => {

		//Avbryt hvis vi mangler container, API-nøkkel, eller hvis kartet allerede er laget
		if (!mapContainerRef.current || !apiKey || mapInstanceRef.current) {
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

		//Global listener for bevegelser som sender data tilbeke til ViewModel. Bruker-pan / zoom
		map.on("moveend", () => {

			const center = map.getCenter();
			const bounds = map.getBounds();

			//Formatert som [vest, sør, øst, nord] for API-et
			const bbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			onMapChange(center.lat, center.lng, bbox, map.getZoom());
		});

		mapInstanceRef.current = map;

		//Cleanup: Fjern kartet fra minnet når komponenten unmountes
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};

	}, [apiKey, style, onMapChange]);


	// ==============================
	// 2. Programmatisk center-endring (søkevalg)
	// ==============================
	useEffect(() => {

		const map = mapInstanceRef.current;

		if (!map) {
			return;
		}

		if (lat == null || lon == null) {
			return;
		}

		//Flytt kartet når lat/lon endres fra ViewModel (f.eks søk)
		//Vi lar MapTiler selv avgjøre om bevegelse faktisk trengs
		map.flyTo({
			center: [lon, lat],
			zoom: zoom,
			essential: true
		});

	}, [lat, lon, zoom]);


	//Legg inn værikoner ved oppdatering av kart
	useEffect(() => {

		const map = mapInstanceRef.current;

		if (!map) {
			return;
		}

		//Fjern alle eksisterende markører før vi tegner nye
		markersRef.current.forEach(marker => {
			marker.remove();
		});

		//Går gjennom alle værpunkter og lag nye markører
		markersRef.current = weatherPoints.map(point => {

			const iconFile = getWeatherIconFileName(point.weatherSymbol);

			const markerEl = document.createElement("div");
			markerEl.className = "map-weather-marker";

			markerEl.innerHTML = `
				<div class="marker-container">
					<img src="/weather_icons/100/${iconFile}" class="marker-icon" alt="vær" />
					<div class="marker-details">
						<span class="marker-temp">${Math.round(point.temp)}°</span>
						<span class="marker-name">${point.name || ""}</span>
					</div>
				</div>
			`;

			return new maptilersdk.Marker({ element: markerEl })
				.setLngLat([point.lon, point.lat])
				.addTo(map);
		});

	}, [weatherPoints]);


	return mapContainerRef;
}