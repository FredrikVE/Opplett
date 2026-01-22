export function getWeatherIconFileName(symbolCode) {
    if (!symbolCode) return "unknown.png";

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

    const code = map[base] ?? "unknown";
    return suffix ? `${code}${suffix}.png` : `${code}.png`;
}
