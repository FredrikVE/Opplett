import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { getWeatherIconFileName } from "../../../utils/CommonUtils/weatherIcons.js";

export default function WeatherMap({ apiKey, style, lat, lon, zoom, weatherPoints }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    
    // Vi bytter ut markerRef (én markør) med markersRef (en liste/array)
    const markersRef = useRef([]);
    
    const initialConfig = useRef({ lat, lon, zoom });

    // 1. Initialiser kartet
    useEffect(() => {
        if (!mapContainerRef.current || !apiKey || mapRef.current) return;
        
        maptilersdk.config.apiKey = apiKey;

        const map = new maptilersdk.Map({
            container: mapContainerRef.current,
            style: style,
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
    }, [apiKey, style]);

    // 2. Flytt kartet når sentrum endres (f.eks. ved søk)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || lat == null || lon == null) return;

        map.flyTo({
            center: [Number(lon), Number(lat)],
            zoom: Number(zoom) || 6,
            essential: true
        });
    }, [lat, lon, zoom]);

    // 3. Oppdater ALLE vær-markører når weatherPoints endres
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !weatherPoints) return;

        // FJERN gamle markører fra kartet før vi legger til nye
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = []; // Tøm lista

        // LEGG TIL nye markører for hvert punkt i arrayen
        weatherPoints.forEach(point => {
            const el = document.createElement('div');
            el.className = 'map-weather-marker';
            
            const iconFile = getWeatherIconFileName(point.weatherSymbol);
            el.innerHTML = `
                <div class="marker-container">
                    <img src="/weather_icons/100/${iconFile}" alt="vær" class="marker-icon" />
                    <span class="marker-temp">${Math.round(point.temp)}°</span>
                </div>
            `;

            const newMarker = new maptilersdk.Marker({ element: el })
                .setLngLat([Number(point.lon), Number(point.lat)])
                .addTo(map);

            // Lagre markøren i ref-en så vi kan fjerne den neste gang
            markersRef.current.push(newMarker);
        });

    }, [weatherPoints]); // Denne kjører hver gang rutenettet i ViewModel oppdateres

    return (
        <div className="map-page-wrap">
            <div ref={mapContainerRef} className="map" />
        </div>
    );
}