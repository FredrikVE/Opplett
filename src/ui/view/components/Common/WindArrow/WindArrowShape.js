// src/ui/view/components/Common/WindArrow/WindArrowShape.js

//SVG Penn-kommandoer
const moveTo = "M";           // Flytt pennen uten å tegne
const drawVerticalLine = "V";  // Tegn loddrett strek
const drawLineTo = "L";        // Tegn en rett strek til et punkt

//Koordinater for pilens geometri
const xCenter = 12;            // Midtaksen på 24x24 lerretet
const xLeft = 5;               // Venstre vingespiss
const xRight = 19;             // Høyre vingespiss

const yBottom = 24;            // Der pilskaftet starter
const yTop = 4;                // Der pilspissen slutter
const yWings = 11;             // Høyden der vingene ender


//Tegner pilskaftet
const arrowShaft = `${moveTo}${xCenter} ${yBottom}${drawVerticalLine}${yTop}`;

//Tegner venstrevinge på pilen
const leftWing = `${moveTo}${xCenter} ${yTop}${drawLineTo}${xLeft} ${yWings}`;

//Tegner høyrevinge på pilen
const rightWing = `${moveTo}${xCenter} ${yTop}${drawLineTo}${xRight} ${yWings}`;

//Samler pilens bestanddeler til en ferdig SVG-streng som angir pilens fasong
export const WIND_ARROW_SHAPE = `${arrowShaft}${leftWing}${rightWing}`;