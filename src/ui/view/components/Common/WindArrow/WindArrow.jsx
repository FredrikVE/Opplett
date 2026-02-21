// src/ui/view/components/Common/WindArrow/WindArrow.jsx
import { WIND_ARROW_SHAPE } from "./WindArrowShape";

export default function WindArrow({ degrees, size}) {
	
    // Avbryter hvis det ikke finnes data for vindretning
	if (degrees == null) {
		return null;
	}

    //Geometri og Koordinater
    const minX = 0;
    const minY = 0;
    const internalViewBoxSize = 24;   //Den interne skalaen pil-stien 
    const viewBoxDefinition = `${minX} ${minY} ${internalViewBoxSize} ${internalViewBoxSize}`; // Definerer det interne lerretet

    //Rotasjonslogikk
    const offsetDegrees = 180;                                      // Tillegg for at pilen skal peke dit det blåser
    const totalRotation = (degrees + offsetDegrees) % 360;          // Beregner vinkelen og holder den innenfor en sirkel
    const rotationCssVariable = `${totalRotation}deg`;              // Formaterer rotasjonen som en gyldig CSS-enhet

    //Stil og Utseende
    const strokeWidth = 2.5;                                        // Tykkelsen på streken i pil-ikonet
    const fillMode = "none";                                        // Sørger for at vi kun ser omrisset, ikke fyll
    const strokeLineCap = "round";                                  // Gjør endene på linjene i pilen avrundede
    const strokeLineJoin = "round";                                 // Gjør hjørnene i pilen avrundede
    const accessibilityTitle = `Vindretning: ${degrees}°`;          // Tekst som vises for skjermlesere og ved "hover"

    return (
        <span 
            className="wind-arrow" 
            title={accessibilityTitle}                              // Gir komponenten en beskrivende tittel
            style={{ 
                "--wind-rotation": rotationCssVariable,             // Sender rotasjonen til CSS som en variabel
                width: `${size}px`,                                 // Setter den ytre bredden basert på "size"-prop
                height: `${size}px`,                                // Setter den ytre høyden basert på "size"-prop
                display: "inline-block"                             // Sørger for at størrelsen og transform fungerer korrekt
            }}
        >
            <svg 
                width={size}                                        // Skalerer SVG-bredden til valgt størrelse
                height={size}                                       // Skalerer SVG-høyden til valgt størrelse
                viewBox={viewBoxDefinition}                         // Beholder det interne koordinatsystemet (0 0 24 24)
                fill={fillMode}                                     // Bruker den eksplisitte fill-modusen
                stroke="currentColor"                               // Arver tekstfargen fra CSS/omgivelsene
                strokeWidth={strokeWidth}                           // Bruker den eksplisitte linjetykkelsen
                strokeLinecap={strokeLineCap}                       // Bruker den eksplisitte linje-avslutningen
                strokeLinejoin={strokeLineJoin}                     // Bruker den eksplisitte linje-koblingen
                style={{ transform: `rotate(${rotationCssVariable})` }} // Utfører selve rotasjonen på SVG-elementet
            >
                <path d={WIND_ARROW_SHAPE} />
            </svg>
        </span>
    );
}