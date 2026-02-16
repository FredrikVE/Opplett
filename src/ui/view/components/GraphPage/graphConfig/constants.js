//src/ui/view/components/GraphPage/graphConfig/constants.js
export const COLORS = {
    // Temperatur
    tempPositive: "#dd4141",
    tempNegative: "#0078ff",

    // Nedbør
    rainExpected: "#5DADE2",
    rainPossible: "#AED6F1",

    // Vind
    wind: "#6a0dad",
    windGust: "#9c27b0",

    // UI / layout
    zebraBand: "rgba(248,249,250,0.8)",
    text: "#111",
    textMuted: "#666",

    uv: {
        low: "#28a745",      // Grønn (0-2)
        moderate: "#fbc02d", // Gul (3-5)
        high: "#d32f2f",     // Rød (6-7)
        veryHigh: "#e64a19", // Oransje/Mørkerød (8-10)
        extreme: "#7b1fa2"   // Lilla (11+)
    }
};

export const HOUR = 3600 * 1000;