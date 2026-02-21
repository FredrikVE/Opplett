// src/ui/view/components/GraphPage/graphConfig/wind/windSeries.js
import { COLORS } from "../constants";

// Hjelpefunksjon for å generere SVG-pil (lik WindArrow.jsx)
function createWindArrowSvg(degrees, color) {
    const rotation = degrees + 180;
    // Vi koder SVG-en for bruk i Highcharts markers
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <g transform="rotate(${rotation} 12 12)">
                <path d="M12 25V5M12 5L5 12M12 5L19 12" />
            </g>
        </svg>
    `.replace(/\n/g, '').replace(/"/g, "'");
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function buildWindSeries(data) {
    const windArrowPoints = (data.windDirections || []).map(d => ({
        x: d.x,
        y: 0.5,
        marker: {
            symbol: `url(${createWindArrowSvg(d.degrees, COLORS.wind)})`,
            width: 24,
            height: 24
        }
    }));

    return [
        {
            name: "Retning",
            type: "scatter",
            data: windArrowPoints,
            yAxis: 1, // Bruker den nye Y-aksen på topp
            zIndex: 5,
            enableMouseTracking: false,
            showInLegend: false,
            pointPlacement: "on",
            clip: false
        },
        {
            name: "Vind",
            type: "areaspline",
            data: data.wind,
            color: COLORS.wind,
            zIndex: 2
        },
        {
            name: "Vindkast",
            type: "spline",
            data: data.gust,
            color: COLORS.windGust,
            dashStyle: "ShortDot",
            zIndex: 3,
            opacity: 0.8
        }
    ];
}