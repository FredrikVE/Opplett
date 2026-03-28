//src/ui/utils/MapUtils/Icons/UpdateWeatherMarkers.js
export function updateWeatherMarkers(markerLayout, activeMarkers) {
    if (!markerLayout) {
        console.warn("[useVisiblePlacePoints] syncAbstractMarkersFromLayout mangler gyldige referanser.");
        return [];
    }

    const markerStatus = markerLayout.update();

    if (!markerStatus) {
        return Array.from(activeMarkers.values());
    }

    try {
        if (markerStatus.removed?.forEach) {
            markerStatus.removed.forEach((abstractMarker) => {
                activeMarkers.delete(abstractMarker.id);
            });
        }

        if (markerStatus.updated?.forEach) {
            markerStatus.updated.forEach((abstractMarker) => {
                activeMarkers.set(abstractMarker.id, abstractMarker);
            });
        }

        if (markerStatus.new?.forEach) {
            markerStatus.new.forEach((abstractMarker) => {
                activeMarkers.set(abstractMarker.id, abstractMarker);
            });
        }
    } 
    
    catch (error) {
        console.error("[useVisiblePlacePoints] Feil under synkronisering av markører:", error);
    }

    return Array.from(activeMarkers.values());
}
