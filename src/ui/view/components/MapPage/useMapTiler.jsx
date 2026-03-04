//src/ui/view/components/MapPage/useMapTiler.jsx
import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {
	const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;
	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef([]);
	const isProgrammaticMove = useRef(false); // Hindrer uendelige løkker mellom kartet og state

	// Initialiser kartet én gang
	useEffect(() => {
		if (!mapContainerRef.current || mapInstanceRef.current) {
			return;
		}

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style,
			center: [Number(lon), Number(lat)],
			zoom: Number(zoom),
			attributionControl: false,
			navigationControl: true,
			geolocateControl: false,
		});

		// Synkroniser kartets startposisjon med ViewModel når stilen er lastet
		map.once("load", () => {
			const bounds = map.getBounds();

			const currentBbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			const currentZoom = map.getZoom();

			onMapChange(lat, lon, currentBbox, currentZoom);
		});

		map.on("moveend", () => {
			if (isProgrammaticMove.current) {
				isProgrammaticMove.current = false;
				return;
			}

			const center = map.getCenter();
			const bounds = map.getBounds();

			const wrappedLng = center.lng.valueOf();
			const normalizedLng = ((wrappedLng + 180) % 360 + 360) % 360 - 180;

			onMapChange(
				center.lat,
				normalizedLng,
				[bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
				map.getZoom()
			);
		});

		mapInstanceRef.current = map;

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
		//eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Håndtering av bbox (søk på regioner / byer osv.)
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map || !bboxToFit) {
			return;
		}

		isProgrammaticMove.current = true;

		const [west, south, east, north] = bboxToFit;
		const southWest = [west, south];
		const northEast = [east, north];

		map.fitBounds(
			[southWest, northEast],
			{
				padding: 40,
				duration: 1000,
				maxZoom: 15		//dette virker dumt fordi det bryter med SSOT-mekanismen for zoom...
			}
		);
	}, [bboxToFit]);

	// Programatisk flytting av kart (uten animasjon)
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map || lat == null || lon == null || bboxToFit) {
			return;
		}

		const center = map.getCenter();

		const threshold = 0.001;					//liker ikke magic number.. bør løftes ut i eksplisitt variabel som forklarer hva det er...
		const hasMovedSignificantly =
			Math.abs(center.lat - lat) > threshold ||
			Math.abs(center.lng - lon) > threshold;

		if (hasMovedSignificantly) {
			isProgrammaticMove.current = true;

			map.jumpTo({
				center: [lon, lat],
				zoom: zoom
			});

			const bounds = map.getBounds();

			const finalBbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			const finalZoom = map.getZoom();

			onMapChange(lat, lon, finalBbox, finalZoom);
		}
	}, [lat, lon, zoom, bboxToFit, onMapChange]);

	// Tegn værikoner
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map) {
			return;
		}

		markersRef.current.forEach(m => m.remove());
		markersRef.current = [];

		markersRef.current = weatherPoints.map(point => {
			const container = document.createElement("div");
			container.className = "map-marker-wrapper";
			container.style.cursor = "pointer";

			container.onclick = (event) => {
				event.stopPropagation();

				if (onLocationClick) {
					onLocationClick({
						lat: point.lat,
						lon: point.lon,
						name: point.name,
						timezone: point.timezone,
						type: point.type,
						bounds: point.bounds
					});
				}
			};

			const root = createRoot(container);
			root.render(<WeatherSymbolLabel point={point} />);

			const marker = new maptilersdk.Marker({ element: container })
				.setLngLat([point.lon, point.lat])
				.addTo(map);

			return marker;
		});

	}, [weatherPoints, onLocationClick]);

	return mapContainerRef;
}