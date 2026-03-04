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
    const isProgrammaticMove = useRef(false); //En vaktpost for å hindre uendelige løkker mellom kartet og state

    //Initialiser kartet karte én gang
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
            //navigationControl: false
            navigationControl: {showCompass: false}
        });

        map.addControl(
            new maptilersdk.NavigationControl({
                showZoom: true,                     //dette er den eneste måten jeg får KUN "pluss minus" til å synes
                showCompass: false,
                //visualizePitch: true
            }),
            "top-right"
        );

        //Synkroniserer kartets startposisjon med ViewModel med en gang stilen er lastet.
        //Dette sikrer at værikonene hentes umiddelbart, uten at brukeren må flytte kartet først.
        map.once("load", () => {
            const bounds = map.getBounds();  //Hent ut de geografiske ytterpunktene (Bounding Box)
            
            //Vi pakker ut grensene i en eksplisitt liste: [Vest, Sør, Øst, Nord]
            const currentBbox = [
                bounds.getWest(), 
                bounds.getSouth(), 
                bounds.getEast(), 
                bounds.getNorth()
            ];

            const currentZoom = map.getZoom();                  //Hent ut nåværende zoom-nivå
            onMapChange(lat, lon, currentBbox, currentZoom);  // Rapporter tilstanden tilbake til ViewModel
        });

        map.on("moveend", () => {
            // Hvis det var vi som flyttet kartet programmatisk, 
            // trenger vi ikke rapportere endringen tilbake som en "ny" lokasjon.
            if (isProgrammaticMove.current) {
                isProgrammaticMove.current = false;
                return;
            }

            const center = map.getCenter();
            const bounds = map.getBounds();
            
            // Normaliserer Lng slik at den alltid er mellom -180 og 180
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
    }, []); //Tom dependency array slik at ikke useEffect lyter til noe


    //Håndtering av bbox-grender for omkringliggende steder (F.eks. ved søk på byer eller regioner)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !bboxToFit) {
            return;
        }

        //Vi markerer bevegelsen som programmatisk for å unngå at kartet 
        //rapporterer små bevegelser tilbake til staten mens det animeres.
        isProgrammaticMove.current = true;

        // Pakker ut BBox-arrayet [Vest, Sør, Øst, Nord] til logiske koordinat-par
        const [west, south, east, north] = bboxToFit;
        const southWest = [west, south];
        const northEast = [east, north];

        // Tilpasser kartvisningen slik at hele området blir synlig
        map.fitBounds(
            [southWest, northEast],
            { 
                padding: 60,      // Margin til kanten av skjermen (piksler)
                duration: 1000,    // Lengde på animasjonen (ms)
                maxZoom: 12        // Hindrer at kartet zoomer for langt inn på små steder
            }
        );
    }, [bboxToFit]);



    //Programatisk flytting av kart ved søk, reset eller gps-lokasjon
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || lat == null || lon == null || bboxToFit) {
            return;
        }

        const center = map.getCenter();
        const threshold = 0.001; 
        const hasMovedSignificantly = 
            Math.abs(center.lat - lat) > threshold || 
            Math.abs(center.lng - lon) > threshold;

        if (hasMovedSignificantly) {
            isProgrammaticMove.current = true;
            
            map.flyTo({
                center: [lon, lat],
                zoom: zoom,
                speed: 1.2,
                essential: true
            });

            //Når fly-to er ferdig, tvinger vi en oppdatering av bbox for å hente vær
            map.once("moveend", () => {
                const bounds = map.getBounds();
                
                //Pakker ut det endelige utsnittet i formatet [Vest, Sør, Øst, Nord]
                const finalBbox = [
                    bounds.getWest(), 
                    bounds.getSouth(), 
                    bounds.getEast(), 
                    bounds.getNorth()
                ];

                const finalZoom = map.getZoom();                //Vi henter det endelige zoom-nivået etter at animasjonen er ferdig
                onMapChange(lat, lon, finalBbox, finalZoom);   //Sender oppdaterte tilstand til ViewModel for nytt API-kall for værikoner.
            });
        }
    }, [lat, lon, zoom, bboxToFit, onMapChange]);

    //Værikoner
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) {
            return;
        }

        //Rydd opp og fjerner eksisterende vær-labler
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        //Tegner nye vær-labels
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