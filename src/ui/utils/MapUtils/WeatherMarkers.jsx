//src/ui/utils/MapUtils/WeatherMarkers.jsx
import * as maptilersdk from "@maptiler/sdk";
import { createRoot } from "react-dom/client";
import WeatherSymbolLabel from "../../view/components/MapPage/WeatherSymbolLabel.jsx";

export function renderWeatherMarkers({ map, markersRef, weatherPoints, onLocationClick }) {
    
    //Sikker unmounting
    if (markersRef.current && markersRef.current.length > 0) {
        const oldMarkers = [...markersRef.current];
        markersRef.current = []; // Tøm referansen umiddelbart

        // Bruk setTimeout for å flytte unmount ut av Reacts "rendering phase"
        setTimeout(() => {
            oldMarkers.forEach(item => {
                if (item.marker) item.marker.remove();
                if (item.root) {
                    try {
                        item.root.unmount();
                    } catch (e) {
                        console.warn("Feil ved fjerning av markør-root:", e);
                    }
                }
            });
        }, 0);
    }

    if (!weatherPoints || weatherPoints.length === 0) return;

    //Legg til nye
    weatherPoints.forEach(point => {
        const container = document.createElement("div");
        container.className = "map-weather-marker-container"; // Sørg for at denne klassen finnes i CSS

        container.onclick = e => {
            e.stopPropagation();
            if (onLocationClick) onLocationClick(point);
        };

        const root = createRoot(container);
        root.render(<WeatherSymbolLabel point={point} />);

        const marker = new maptilersdk.Marker({ 
            element: container,
            anchor: 'center' 
        })
            .setLngLat([point.lon, point.lat])
            .addTo(map);

        markersRef.current.push({ marker, root });
    });
}