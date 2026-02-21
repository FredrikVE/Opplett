//src/ui/utils/WindUtils/windDescriptionUtil.js

/**
Vind hastighetene i denne koden er basert på definisjoer funnet i Store Norske Leksikon.
https://snl.no/kuling
 */

export const getWindSpeedDescription = (speed) => {
    if (speed <= 0.2) return "Stille";
    if (speed <= 1.5) return "Flau vind";
    if (speed <= 3.3) return "Svak vind";
    if (speed <= 5.4) return "Lett bris";
    if (speed <= 7.9) return "Laber bris";
    if (speed <= 10.7) return "Frisk bris";
    if (speed <= 13.8) return "Liten kuling";
    if (speed <= 17.1) return "Stiv kuling";
    if (speed <= 20.7) return "Sterk kuling";
    if (speed <= 24.4) return "Liten storm";
    if (speed <= 28.4) return "Full storm";
    if (speed <= 32.6) return "Sterk storm";
    return "Orkan";
};

export const getWindDirectionText = (degrees) => {
    // Liste over himmelretninger i 22.5 graders intervaller
    const directions = [
        "nord", "nord-nordøst", "nordøst", "øst-nordøst",
        "øst", "øst-sørøst", "sørøst", "sør-sørøst",
        "sør", "sør-sørvest", "sørvest", "vest-sørvest",
        "vest", "vest-nordvest", "nordvest", "nord-nordvest"
    ];

    //MOD 16 sikrer at 360 grader mapper tilbake til nord, som er index 0
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
};