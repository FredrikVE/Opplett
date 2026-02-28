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

        // Lytt på bevegelser og send data tilbake til ViewModel
        map.on("moveend", () => {
            const center = map.getCenter();
            const bounds = map.getBounds();
            
            // Formatert som [vest, sør, øst, nord] for API-et
            const bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ];

            onMapChange?.(center.lat, center.lng, bbox, map.getZoom());
        });

        mapInstanceRef.current = map;

        // Cleanup: Fjern kartet fra minnet når komponenten unmountes
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, 
    //[apiKey, style, lat, lon, zoom, onMapChange]);        //Gir masse warnings i konsollen, men ikke i VS code.
    [apiKey, style]);   //Gir warning i VS code om at useEffect ikke lytter til alt og bryter best practice


    //Synkronisering ved flyttting av kartet VM-staten endres ved for eks søk
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat === null || lon === null) {
            return;
        }
        
        const currentCenter = map.getCenter();
        
        //Sjekk om avviket mellom kartet og staten er stort nok til å flytte (unngår loop)
        const hasMovedSignificantly = 
            Math.abs(currentCenter.lat - lat) > 0.0001 || 
            Math.abs(currentCenter.lng - lon) > 0.0001;

        if (hasMovedSignificantly) {
            map.flyTo({ 
                center: [lon, lat], 
                zoom: zoom,
                essential: true 
            });
        }
    }, [lat, lon, zoom]);


    //Oppdaterer værikoner og stedsnavn på kartet
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) {
            return;
        }

        //Fjern alle eksisterende markører før vi tegner nye
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        //Går gjennom alle værpunkter og lag nye markører
        const newMarkers = weatherPoints.map(point => {
            const iconFile = getWeatherIconFileName(point.weatherSymbol);
            
            //Lager HTML-elementet for å viser værikon og stedsnavn
            const markerEl = document.createElement("div");
            markerEl.className = "map-weather-marker";
            
            // Inkluderer nå point.name for stedsnavn-label
            markerEl.innerHTML = `
                <div class="marker-container">
                    <img src="/weather_icons/100/${iconFile}" class="marker-icon" alt="vær" />
                    <div class="marker-details">
                        <span class="marker-temp">${Math.round(point.temp)}°</span>
                        <span class="marker-name">${point.name || ""}</span>
                    </div>
                </div>
            `;

            //Opprett markøren i MapTiler og legg den til på kartet
            return new maptilersdk.Marker({ element: markerEl })
                .setLngLat([point.lon, point.lat])
                .addTo(map);
        });

        //Lagre referansen til de nye markørene
        markersRef.current = newMarkers;

    }, [weatherPoints]);


    return mapContainerRef;
}