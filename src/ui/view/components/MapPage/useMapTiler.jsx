import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import { MarkerLayout } from "@maptiler/marker-layout";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "./WeatherSymbolLabel.jsx";

export function useMapTiler(props) {

	const { apiKey, style, lat, lon, zoom, bboxToFit, weatherPoints, onMapChange, onLocationClick } = props;

	console.log("[DEBUG MAP] Hook init:", {
		lat,
		lon,
		zoom,
		hasBBox: !!bboxToFit,
		points: weatherPoints?.length
	});

	const mapContainerRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef([]);
	const markerLayoutRef = useRef(null);
	const isProgrammaticMove = useRef(false);

	const SIGNIFICANT_MOVE_THRESHOLD = 0.01;
	const SIGNIFICANT_ZOOM_THRESHOLD = 0.1;

	const FIT_BOUNDS_PADDING = 50;
	const FIT_BOUNDS_MAX_ZOOM = 14;
	const FIT_BOUNDS_DURATION = 1500;

    const extractCityPoints = () => {

        const map = mapInstanceRef.current;

        if (!map) {
            return [];
        }

        const features = map.queryRenderedFeatures({
            layers: ["City labels", "Place labels"]
        });

        console.log("[DEBUG MAP] Rendered label features:", features?.length);

        const points = [];

        for (const feature of features) {

            if (!feature.geometry) {
                continue;
            }


            if (!["city", "town", "village", "suburb"].includes(feature.properties?.class)) {
                continue;
            }
    
        

            const coords = feature.geometry.coordinates;

            points.push({
                name: feature.properties?.name || "Unknown",
                lon: coords[0],
                lat: coords[1]
            });
        }

        console.log("[DEBUG MAP] Extracted city points:", points.length);

        return points;
    };



	/**
	 * Initialiser kartet
	 */
	useEffect(() => {

		console.log("[DEBUG MAP] Initialising map...");

		if (!mapContainerRef.current) {
			console.log("[DEBUG MAP] Map container not ready");
			return;
		}

		if (mapInstanceRef.current) {
			console.log("[DEBUG MAP] Map already initialised");
			return;
		}

		maptilersdk.config.apiKey = apiKey;

		const map = new maptilersdk.Map({
			container: mapContainerRef.current,
			style: style,
			center: [Number(lon), Number(lat)],
			zoom: Number(zoom),
			attributionControl: false,
			navigationControl: true,
			geolocateControl: false,
		});

		console.log("[DEBUG MAP] Map instance created");

		map.on("load", () => {

			console.log("[DEBUG MAP] Map loaded");

			markerLayoutRef.current = new MarkerLayout(map, {
				layers: ["City labels", "Place labels"],
				markerSize: [40, 70],
				offset: [0, -10],
				markerAnchor: "center",
				sortingProperty: "rank",
				sortingOrder: "ascending",
				filter: (feature) => {
					return ["city", "town"].includes(feature.properties.class);
				}
			});

			console.log("[DEBUG MAP] MarkerLayout initialised");

			const bounds = map.getBounds();

			const bbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			const points = extractCityPoints();

			console.log("[DEBUG MAP] Initial bbox:", bbox);

			onMapChange(lat, lon, bbox, map.getZoom(), points);
		});

		map.on("moveend", () => {

			console.log("[DEBUG MAP] moveend triggered");

			if (isProgrammaticMove.current) {
				console.log("[DEBUG MAP] Ignoring programmatic move");
				isProgrammaticMove.current = false;
				return;
			}

			const center = map.getCenter();
			const bounds = map.getBounds();

			const bbox = [
				bounds.getWest(),
				bounds.getSouth(),
				bounds.getEast(),
				bounds.getNorth()
			];

			const points = extractCityPoints();

			console.log("[DEBUG MAP] Map moved:", {
				lat: center.lat,
				lon: center.lng,
				zoom: map.getZoom(),
				points: points.length
			});

			onMapChange(
				center.lat,
				center.lng,
				bbox,
				map.getZoom(),
				points
			);
		});

		mapInstanceRef.current = map;

		return () => {

			console.log("[DEBUG MAP] Destroying map");

			if (!mapInstanceRef.current) {
				return;
			}

			mapInstanceRef.current.remove();
			mapInstanceRef.current = null;

		};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apiKey, style]);



	/**
	 * Marker-logikk
	 */
	useEffect(() => {

		const map = mapInstanceRef.current;

		if (!map) {
			console.log("[DEBUG MAP] No map instance yet for markers");
			return;
		}

		console.log("[DEBUG MAP] Rendering markers:", weatherPoints?.length);

		for (const marker of markersRef.current) {
			marker.remove();
		}

		markersRef.current = [];

		if (!weatherPoints || weatherPoints.length === 0) {
			console.log("[DEBUG MAP] No weather points to render");
			return;
		}

		for (const point of weatherPoints) {

			console.log("[DEBUG MAP] Rendering marker:", point.name, point.lat, point.lon);

			const element = document.createElement("div");
			element.className = "map-marker-wrapper";
			element.style.zIndex = "1000";

			element.onclick = () => {

				console.log("[DEBUG MAP] Marker clicked:", point.name);

				if (onLocationClick) {
					onLocationClick(point);
				}
			};

			const root = createRoot(element);
			root.render(<WeatherSymbolLabel point={point} />);

			const marker = new maptilersdk.Marker({ element })
				.setLngLat([point.lon, point.lat])
				.addTo(map);

			markersRef.current.push(marker);
		}

	}, [weatherPoints, onLocationClick]);



	/**
	 * Programmatisk flytting av kart
	 */
	useEffect(() => {

		const map = mapInstanceRef.current;

		if (!map) {
			return;
		}

		console.log("[DEBUG MAP] Evaluating programmatic move");

		if (bboxToFit) {

			console.log("[DEBUG MAP] Fitting bounds:", bboxToFit);

			isProgrammaticMove.current = true;

			map.fitBounds(bboxToFit, {
				padding: FIT_BOUNDS_PADDING,
				maxZoom: FIT_BOUNDS_MAX_ZOOM,
				duration: FIT_BOUNDS_DURATION
			});

			return;
		}

		const center = map.getCenter();

		const latMoved =
			Math.abs(center.lat - lat) > SIGNIFICANT_MOVE_THRESHOLD;

		const lonMoved =
			Math.abs(center.lng - lon) > SIGNIFICANT_MOVE_THRESHOLD;

		const zoomChanged =
			Math.abs(map.getZoom() - zoom) > SIGNIFICANT_ZOOM_THRESHOLD;

		const hasMovedSignificantly =
			latMoved || lonMoved || zoomChanged;

		if (!hasMovedSignificantly) {
			console.log("[DEBUG MAP] No significant map move required");
			return;
		}

		console.log("[DEBUG MAP] Flying map to:", {
			lat,
			lon,
			zoom
		});

		isProgrammaticMove.current = true;

		map.flyTo({
			center: [lon, lat],
			zoom: zoom,
			speed: 1.2,
			curve: 1.4,
			essential: true
		});

	}, [lat, lon, zoom, bboxToFit]);

	return mapContainerRef;
}