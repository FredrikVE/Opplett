// src/ui/view/components/MapPage/WeatherMap.jsx
import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { GeocodingControl } from "@maptiler/geocoding-control/react";
import "@maptiler/geocoding-control/style.css";

export default function WeatherMap({ apiKey, style, lat, lon, zoom }) {
	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const [mapInstance, setMapInstance] = useState(null);

	//Frys initial center/zoom så init-effekten slipper å ha lat/lon/zoom i deps
	const initialCenterRef = useRef({ lat, lon });
	const initialZoomRef = useRef(zoom);

	// Init kart (kun én gang per apiKey/style)
	useEffect(() => {
		if (!mapContainerRef.current) {
			return;
		}

		if (!apiKey) {
			return;
		}

		if (mapRef.current) {
			return;
		}

		maptilersdk.config.apiKey = apiKey;

		const mapStyle = maptilersdk.MapStyle[style] ?? maptilersdk.MapStyle.HYBRID;

		const { lat: initialLat, lon: initialLon } = initialCenterRef.current;
		const initialZoom = initialZoomRef.current;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style: mapStyle,
			center: [initialLon, initialLat],
			zoom: initialZoom
		});

		map.addControl(new maptilersdk.NavigationControl(), "top-right");

		mapRef.current = map;
		setMapInstance(map);

		return () => {
			map.remove();
			mapRef.current = null;
			setMapInstance(null);
		};
	}, [apiKey, style]);

	// Fly når ViewModel endrer koordinater
	useEffect(() => {
		if (!mapRef.current) {
			return;
		}

		if (lat == null || lon == null) {
			return;
		}

		mapRef.current.flyTo({
			center: [lon, lat],
			zoom: zoom,
			speed: 0.8
		});
	}, [lat, lon, zoom]);

	return (
		<div className="map-page-wrap">
			<div ref={mapContainerRef} className="map" />

			{mapInstance && (
				<div className="geocoding">
					<GeocodingControl
						apiKey={apiKey}
						map={mapInstance}
						marker={true}
						showResultsWhileTyping={true}
						placeholder="Søk etter sted..."
					/>
				</div>
			)}
		</div>
	);
}