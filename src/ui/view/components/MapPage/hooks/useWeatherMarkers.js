// src/ui/view/components/MapPage/hooks/useWeatherMarkers.js
import { useEffect, useRef } from "react";
import { renderWeatherMarkers } from "../../../../utils/MapUtils/WeatherMarkers.jsx";

export function useWeatherMarkers(map, weatherPoints) {
    const weatherMarkersRef = useRef(new Map());

    useEffect(() => {
        if (!map) return;

        //Kopier ref.current til en lokal variabel for å tilfredsstille linteren
        const currentMarkersMap = weatherMarkersRef.current;

        renderWeatherMarkers({
            map,
            markersRef: weatherMarkersRef,
            weatherPoints
        });

        //Cleanup bruker den lokale variabelen, ikke ref.current direkte
        return () => {
            
            currentMarkersMap.forEach((entry) => {
                //Fjern markøren fra selve kartet (trygt å gjøre synkront)
                entry.marker?.remove();
                
                //Utsett React-unmount for å unngå "synchronously unmount a root"-feilen
                if (entry.root) {
                    setTimeout(() => {
                        
                        try {
                            entry.root.unmount();
                        } 
                        
                        catch (error) {
                            console.warn("[WeatherMarkers] Feil ved utsatt unmount:", error);
                        }
                    }, 0);
                }
            });
            
            currentMarkersMap.clear();
        };
    }, [map, weatherPoints]);
}