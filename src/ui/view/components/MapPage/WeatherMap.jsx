// src/ui/view/components/MapPage/WeatherMap.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

const STREETS_V4_STYLE = "https://api.maptiler.com/maps/streets-v4/style.json";
const DEFAULT_CENTER = [10.75, 59.91];
const DEFAULT_ZOOM = 6;

export default function WeatherMap({ apiKey, lat, lon, zoom }) {

	

	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);


	//INIT – kjører kun én gang
	useEffect(() => {
		if (!mapContainerRef.current || !apiKey || mapRef.current) {
			return;
		}

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style: STREETS_V4_STYLE,
			center: DEFAULT_CENTER,
			zoom: DEFAULT_ZOOM
		});

		mapRef.current = map;

		const resizeObserver = new ResizeObserver(() => {
			map.resize();
		});

		resizeObserver.observe(mapContainerRef.current);

		return () => {
			resizeObserver.disconnect();
			map.remove();
			mapRef.current = null;
		};
	}, [apiKey]);

	//Fly når coords endres
	useEffect(() => {
		if (!mapRef.current || lat == null || lon == null) {
			return;
		}

		mapRef.current.flyTo({
			center: [lon, lat],
			zoom: zoom ?? DEFAULT_ZOOM,
			speed: 0.8,
			curve: 1.2,
			essential: true
		});
	}, [lat, lon, zoom]);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />
		</div>
	);
}