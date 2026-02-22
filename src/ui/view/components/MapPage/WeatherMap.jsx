import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { getWeatherIconFileName } from "../../../utils/CommonUtils/weatherIcons.js";

export default function WeatherMap({ apiKey, style, lat, lon, zoom, currentWeather }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    
    // Vi lagrer start-verdiene i en Ref slik at den første useEffecten 
    // ikke trenger å "lytte" på endringer i lat/lon/zoom.
    const initialConfig = useRef({ lat, lon, zoom });

    // 1. Initialiser kartet (Kjører kun ved mount eller bytte av API-nøkkel/Stil)
    useEffect(() => {
        if (!mapContainerRef.current || !apiKey || mapRef.current) return;
        
        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
            // Bruker verdiene fra Ref-en her
            center: [Number(initialConfig.current.lon), Number(initialConfig.current.lat)],
            zoom: Number(initialConfig.current.zoom) || 6,
            attributionControl: false
        });

        mapRef.current = map;

        return () => { 
            if (mapRef.current) {
                mapRef.current.remove(); 
                mapRef.current = null;
            }
        };
    }, [apiKey, style]); // lat, lon, zoom er nå ikke lenger nødvendige her

    // 2. Oppdater markør og flytt kart (Kjører ved hver endring i posisjon eller vær)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || lat == null || lon == null) return;

        // Flytt kameraet til ny posisjon
        map.flyTo({
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom) || 6,
            essential: true
        });

        // Oppdater vær-markøren
        if (currentWeather) {
            if (markerRef.current) {
                markerRef.current.remove();
            }

            const el = document.createElement('div');
            el.className = 'map-weather-marker';
            
            const iconFile = getWeatherIconFileName(currentWeather.weatherSymbol);
            el.innerHTML = `
                <div class="marker-container">
                    <img src="/weather_icons/100/${iconFile}" alt="vær" class="marker-icon" />
                    <span class="marker-temp">${Math.round(currentWeather.temp)}°</span>
                </div>
            `;

            markerRef.current = new maptilersdk.Marker({ element: el })
                .setLngLat([Number(lon), Number(lat)])
                .addTo(map);
        }
    }, [lat, lon, zoom, currentWeather]); // Denne vil nå styre alle bevegelser

    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}