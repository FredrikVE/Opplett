//src/ui/utils/CommonUtils/weatherIcons.js

/******************** Kildehenvisning ****************************

## Bruk av ikoner.

NRK tillater fri bruk av disse ikonene mot kreditering.
Værikonene brukt i dette programmet er hentet fra NRK og yr.no.

## Bruk av AI
Denne metoden er i stor grad generert av ChatGPT ettersom den gjør svært mye repetetivt arbeid.

#Kilder:
NRK. (u å). Yr weather symbols. Hentet April 2024 fra NRK - GitHub:
https://nrkno.github.io/yr-weather-symbols/

ChatGPT. (2024, April). ChatGPT.
Hentet fra GhatGPT: https://chatgpt.com/

 **********************************************************************/

export function getWeatherIconFileName(symbolCode) {
    //if (!symbolCode) return "unknown.png";
    if (!symbolCode) {
        return null;
    }


    const normalized = symbolCode
        .toLowerCase()
        .replace(/_/g, "")
        .replace(/\s+/g, "")
        .trim();

    let suffix = "";

    if (normalized.endsWith("day")) suffix = "d";
    else if (normalized.endsWith("night")) suffix = "n";
    else if (normalized.endsWith("polartwilight")) suffix = "m";

    const base = normalized
        .replace(/day$/, "")
        .replace(/night$/, "")
        .replace(/polartwilight$/, "");

    const map = {
        clearsky: "01",
        fair: "02",
        partlycloudy: "03",
        cloudy: "04",
        lightrainshowers: "40",
        rainshowers: "05",
        heavyrainshowers: "41",
        lightrainshowersandthunder: "24",
        rainshowersandthunder: "06",
        heavyrainshowersandthunder: "25",
        lightsleetshowers: "42",
        sleetshowers: "07",
        heavysleetshowers: "43",
        lightsnowshowers: "44",
        snowshowers: "08",
        heavysnowshowers: "45",
        lightrain: "46",
        rain: "09",
        heavyrain: "10",
        lightsleet: "47",
        sleet: "12",
        heavysleet: "48",
        lightsnow: "49",
        snow: "13",
        heavysnow: "50",
        fog: "15"
    };

    const code = map[base];
    if (!code) {
        return null;
    }
    
    return suffix ? `${code}${suffix}.png` : `${code}.png`;
}
