//src/ui/utils/MapForecastUtils/gridCalculator.js

/**
 * Genererer et sett med koordinater basert på et rutenett (grid).
 * Brukes for å vise vær-ikoner spredt utover kartet uten å overbelaste API.
 */
export const getGridPoints = (bounds, zoom) => {
    const points = [];
    
    // Dynamisk steglengde basert på zoom:
    // Lav zoom (viser land): 1.0 eller 0.5 grader (få punkter)
    // Høy zoom (viser by): 0.1 eller 0.05 grader (tettere punkter)
    let step = 0.5; 
    if (zoom >= 10) step = 0.1;
    else if (zoom >= 8) step = 0.2;
    else if (zoom < 6) step = 1.0;

    // Finn grensene og rund dem til nærmeste "step"
    const startLat = Math.floor(bounds.south / step) * step;
    const endLat = Math.ceil(bounds.north / step) * step;
    const startLon = Math.floor(bounds.west / step) * step;
    const endLon = Math.ceil(bounds.east / step) * step;

    // Begrens antall punkter i loopen for sikkerhets skyld (max 30 per utsnitt)
    let count = 0;
    for (let lat = startLat; lat <= endLat; lat += step) {
        for (let lon = startLon; lon <= endLon; lon += step) {
            if (count > 30) break; 
            
            points.push({
                lat: parseFloat(lat.toFixed(4)),
                lon: parseFloat(lon.toFixed(4))
            });
            count++;
        }
    }
    
    return points;
};