// src/ui/view/components/GraphPage/graphConfig/wind/windSeries.js
import { COLORS } from "../constants";
import { WIND_ARROW_SHAPE } from "../../../Common/WindArrow/WindArrowShape.js"

function createWindArrowSvg(degrees, color) {
    
	//Standarder og Protokoller
    const svgNamespace = "http://www.w3.org/2000/svg";
    const dataUrlHeader = "data:image/svg+xml;charset=utf-8";

    //Koordinatsystem (ViewBox)
    const minX = 0;
    const minY = 0;
    const canvasWidth = 24;
    const canvasHeight = 24;
    const viewBoxDefinition = `${minX} ${minY} ${canvasWidth} ${canvasHeight}`;

    //Geometriske senterpunkter for rotasjon
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    //Stil-attributter
    const fillMode = "none";
    const strokeColor = color;
    const strokeWidth = 2.5;
    const strokeLineCap = "round";
    const strokeLineJoin = "round";

    //Rotasjonslogikk
    const offsetDegrees = 180; 
    const totalRotation = (degrees + offsetDegrees) % 360;
    const transformAttribute = `rotate(${totalRotation} ${centerX} ${centerY})`;

    //Generering av SVG-kildekode
    //Vi bruker enkle anførselstegn konsekvent her, så slipper vi å "vaske" dem senere.
    const svgCode = `
        <svg xmlns='${svgNamespace}' width='${canvasWidth}' height='${canvasHeight}' viewBox='${viewBoxDefinition}'>
            <path 
                d='${WIND_ARROW_SHAPE}' 
                fill='${fillMode}' 
                stroke='${strokeColor}' 
                stroke-width='${strokeWidth}' 
                stroke-linecap='${strokeLineCap}' 
                stroke-linejoin='${strokeLineJoin}'
                transform='${transformAttribute}'
            />
        </svg>
    `;

    //Fjerner linjeskift og ekstra mellomrom for å holde URL-en kompakt.
    const minimizeWhitespaceRegex = /\s+/g;
    const optimizedSvgCode = svgCode.trim().replace(minimizeWhitespaceRegex, ' ');

    //Konstruksjon av ferdig bildefil-URL
    const encodedSvg = encodeURIComponent(optimizedSvgCode);
    const completeDataUrl = `${dataUrlHeader},${encodedSvg}`;

    return completeDataUrl;
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
			yAxis: 1,
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