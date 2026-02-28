// src/ui/view/components/MapPage/WeatherMap.jsx
import { useMapTiler } from "./useMapTiler.jsx";
import "@maptiler/sdk/dist/maptiler-sdk.css";

export default function WeatherMap({ apiKey, style, lat, lon, zoom, weatherPoints, onMapChange }) {
    const mapContainerRef = useMapTiler({ apiKey, style, lat, lon, zoom, weatherPoints, onMapChange });

    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}