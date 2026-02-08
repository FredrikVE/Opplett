// src/ui/view/components/HomePage/Graph/graphConfig/series.js
import { COLORS } from "./constants.js";
import { getWeatherIconFileName } from "../../../../../utils/weatherIcons.js";

function buildWeatherSymbolSeries(symbolData) {
    
	if (!symbolData || symbolData.length === 0) {
        return { 
			type: 'scatter', 
			data: [] 
		};
    }

    const points = symbolData.map(s => {
        const fileName = getWeatherIconFileName(s.symbolCode);
        
        if (!fileName) {
            return null;
        }

        return {
            x: s.x, // Tidspunkt på X-aksen
            y: 0.5, // Plassering på Y-aksen (sentrert i den 20% høye "ikon-sonen" øverst)
            marker: {
                // Highcharts støtter 'url(path)' som symbol
                symbol: `url(/weather_icons/200/${fileName})`,
                width: 32, 
                height: 32
            }
        };
    }).filter(p => p !== null); // Rens ut null-verdier

    return {
        name: 'Vær',
        type: 'scatter',
        data: points,
        yAxis: 2,               // Bruker den dedikerte "ikon-aksen" (øverste 20% av grafen)
        zIndex: 5,              // Legges foran temperatur- og nedbørslinjer
        enableMouseTracking: false, // Ikonene reagerer ikke på mus (ingen tooltip)
        showInLegend: false,    // Ikke vis "Vær" i tegnforklaringen under grafen
        dataLabels: {
            enabled: false
        }
    };
}

export function buildSeries(data) {
    return [
        // --- LAG 1: Værsymboler (Øverst) ---
        buildWeatherSymbolSeries(data.weatherSymbols),

        // --- LAG 2: Temperatur (Område/Linje) ---
        {
            name: 'Temperatur',
            type: 'areaspline',
            data: data.temperature,
            zIndex: 3,
            tooltip: {
                valueSuffix: '°C'
            }
        },

        // --- LAG 3: Nedbør (Søyler) ---
        {
            name: 'Nedbør',
            type: 'column',
            data: data.rain,
            yAxis: 1, // Bruker høyre Y-akse (mm)
            color: COLORS.rainExpected,
            zIndex: 2,
            tooltip: {
                valueSuffix: ' mm'
            }
        },

        // --- LAG 4: Mulig ekstra nedbør (Stablede søyler) ---
        {
            name: 'Mulig ekstra',
            type: 'column',
            data: data.rainExtra,
            yAxis: 1, // Bruker høyre Y-akse (mm)
            color: COLORS.rainPossible,
            zIndex: 1,
            tooltip: {
                valueSuffix: ' mm'
            }
        }
    ];
}