//src/ui/view/components/MapPage/MapLayerToggle/LayerIconShape.js

//SVG Penn-kommandoer
const moveTo = "M";
const drawLineTo = "L";
const closePath = "z";

//Koordinater for lag-ikonets geometri (24x24 lerret)
const xCenter = 12;
const xLeft = 2;
const xRight = 22;

//Y-koordinater for de tre lagene
const yTop = 2;          // Toppen av øverste lag
const yMiddle = 7;       // Midtpunktet (der alle lag møtes)
const yBottom = 12;      // Bunnpunktet for nederste lag

//Vertikale offsets for de to ekstra lagene
const ySecondLayer = 12;  // Andre lag (midterst)
const ySecondLayerBottom = 17;

const yThirdLayer = 17;   // Tredje lag (nederst)
const yThirdLayerBottom = 22;

//Øverste lag (diamantform med fyll-mulighet)
const topLayer = [
	`${moveTo}${xCenter} ${yTop}`,
	`${drawLineTo}${xLeft} ${yMiddle}`,
	`${drawLineTo}${xCenter} ${yBottom}`,
	`${drawLineTo}${xRight} ${yMiddle}`,
	`${closePath}`,
].join("");

//Midterste lag (bare bue)
const middleLayer = [
	`${moveTo}${xLeft} ${ySecondLayer}`,
	`${drawLineTo}${xCenter} ${ySecondLayerBottom}`,
	`${drawLineTo}${xRight} ${ySecondLayer}`,
].join("");

//Nederste lag (bare bue)
const bottomLayer = [
	`${moveTo}${xLeft} ${yThirdLayer}`,
	`${drawLineTo}${xCenter} ${yThirdLayerBottom}`,
	`${drawLineTo}${xRight} ${yThirdLayer}`,
].join("");

export const LAYER_ICON_PATHS = {
	top: topLayer,
	middle: middleLayer,
	bottom: bottomLayer,
};